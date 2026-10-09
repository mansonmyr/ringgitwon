import fs from 'node:fs/promises';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const asOf = process.argv.find(a => a.startsWith('--as-of='))?.slice(8);
assert.match(asOf ?? '', /^\d{4}-\d{2}-\d{2}$/);
const DAY = 86400000;
const date = n => new Date(n * DAY).toISOString().slice(0, 10);
const day = s => Date.parse(s) / DAY;
const cutoff = day(asOf) - 1; // Never score the cutoff's still-open day.
const start = `${Number(asOf.slice(0, 4)) - 11}-01-01`;
const source = await fs.readFile('src/lib/forecast.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { estimateForecast, PATH_COUNT } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const cache = '.cache/backtest';
await fs.mkdir(cache, { recursive: true });
const providers = ['frankfurter', 'twelve'];
const weekday = d => ![0, 6].includes(new Date(d * DAY).getUTCDay());
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
const quantile = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) * p)]; };
async function getData(provider) {
  const file = `${cache}/${provider}-${start}-${asOf}.json`;
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  let points, url, headers = { Accept: 'application/json' };
  if (provider === 'twelve') {
    const env = await fs.readFile('.env.local', 'utf8');
    const key = env.split('\n').find(l => l.startsWith('TWELVE_DATA_API_KEY='))?.slice('TWELVE_DATA_API_KEY='.length).trim();
    if (!key) throw new Error('Missing local Twelve Data key.');
    headers.Authorization = `apikey ${key}`;
    url = new URL('https://api.twelvedata.com/time_series');
    url.search = new URLSearchParams({ symbol: 'MYR/KRW', interval: '1day', start_date: start, end_date: asOf, outputsize: '5000', order: 'asc' }).toString();
  } else {
    url = new URL('https://api.frankfurter.dev/v2/rates');
    url.search = new URLSearchParams({ base: 'EUR', quotes: 'MYR,KRW', from: start, to: asOf }).toString();
  }
  let response;
  try { response = await fetch(url, { headers, signal: AbortSignal.timeout(60000) }); }
  catch { throw new Error(`${provider}: network request failed (credentials omitted).`); }
  const body = await response.json();
  if (!response.ok || body.status === 'error') throw new Error(`${provider}: provider error ${response.status}/${Number(body.code) || 'unknown'} (raw response omitted).`);
  if (provider === 'twelve') {
    assert.equal(body.meta?.symbol, 'MYR/KRW'); assert.equal(body.meta?.interval, '1day');
    assert.ok(Array.isArray(body.values) && body.values.length < 5000, 'Refuse possibly truncated history.');
    points = body.values.map(r => ({ date: r.datetime, rate: Number(r.close) }));
  } else {
    assert.ok(Array.isArray(body)); const map = new Map();
    for (const r of body) {
      assert.ok(r.base === 'EUR' && ['MYR', 'KRW'].includes(r.quote) && Number.isFinite(r.rate) && r.rate > 0);
      const entry = map.get(r.date) ?? {}; assert.equal(entry[r.quote], undefined); entry[r.quote] = r.rate; map.set(r.date, entry);
    }
    points = [...map].flatMap(([date, r]) => r.MYR && r.KRW ? [{ date, rate: r.KRW / r.MYR }] : []);
  }
  assert.ok(points.every(p => /^\d{4}-\d{2}-\d{2}$/.test(p.date) && Number.isFinite(p.rate) && p.rate > 0));
  points = points.filter(p => p.date >= start && day(p.date) <= cutoff).sort((a, b) => a.date.localeCompare(b.date));
  assert.ok(points.every((p, i) => !i || points[i - 1].date < p.date));
  const saved = { provider, source: url.toString(), fetchedAt: new Date().toISOString(), points };
  await fs.writeFile(file, JSON.stringify(saved)); return saved;
}
function auc(rows) {
  const sorted = [...rows].sort((a,b) => a.p - b.p); let rankSum = 0, positives = 0;
  for (let i=0;i<sorted.length;) { let j=i+1; while(j<sorted.length && sorted[j].p===sorted[i].p) j++; const rank=(i+1+j)/2; for(let k=i;k<j;k++) if(sorted[k].y) { positives++; rankSum+=rank; } i=j; }
  return positives && positives < rows.length ? (rankSum-positives*(positives+1)/2)/(positives*(rows.length-positives)) : null;
}
function summarize(rows) {
  const brier = key => mean(rows.map(r => (r[key]-r.y)**2));
  const model = brier('p'), baseline = brier('frequency');
  return { cases: rows.length, origins: new Set(rows.map(r=>r.origin)).size, meanProbability: mean(rows.map(r=>r.p)), hitRate: mean(rows.map(r=>r.y)), bias: mean(rows.map(r=>r.p-r.y)), brier: model, frequencyBrier: baseline, oneYearBrier: brier('oneYear'), noChangeBrier: mean(rows.map(r=>r.y)), skillVsFrequency: baseline ? 1-model/baseline : null, auc: auc(rows), logLoss: mean(rows.map(r=> { const p=Math.max(1/(2*PATH_COUNT),Math.min(1-1/(2*PATH_COUNT),r.p));return -(r.y*Math.log(p)+(1-r.y)*Math.log(1-p)); })) };
}
// Circular moving blocks of calendar months; all thresholds/horizons remain clustered.
function intervals(rows, block = 6) {
  const observedKeys = [...new Set(rows.map(r=>r.origin))].sort();
  const first = new Date(`${observedKeys[0]}T00:00:00Z`), last = observedKeys.at(-1);
  const keys=[];
  for (let d=new Date(first); d.toISOString().slice(0,10)<=last; d.setUTCMonth(d.getUTCMonth()+1)) keys.push(d.toISOString().slice(0,10));
  const groups=keys.map(k=>rows.filter(r=>r.origin===k));
  let seed = 284731; const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const samples={ brier:[], bias:[], deltaFrequency:[], deltaOneYear:[] };
  for(let b=0;b<2000;b++) {
    const draw=[]; for(let k=0;k<groups.length;) {const offset=Math.floor(random()*groups.length);for(let j=0;j<block && k<groups.length;j++,k++)draw.push(...groups[(offset+j)%groups.length]);}
    if (!draw.length) { b--; continue; }
    samples.brier.push(mean(draw.map(r=>(r.p-r.y)**2)));
    samples.bias.push(mean(draw.map(r=>r.p-r.y)));
    samples.deltaFrequency.push(mean(draw.map(r=>(r.p-r.y)**2-(r.frequency-r.y)**2)));
    samples.deltaOneYear.push(mean(draw.map(r=>(r.p-r.y)**2-(r.oneYear-r.y)**2)));
  }
  return Object.fromEntries(Object.entries(samples).map(([k,v])=>[k,[quantile(v,.025),quantile(v,.975)]]));
}
const results={};
for (const provider of providers) {
  const saved = await getData(provider); const weekdaysOnly = provider==='twelve';
  const points=saved.points.filter(p=>!weekdaysOnly || weekday(day(p.date))); const map=new Map(points.map(p=>[day(p.date),p.rate]));
  function observed(d) { if(map.has(d))return map.get(d); if(weekdaysOnly && !weekday(d)) {const friday=d-(new Date(d*DAY).getUTCDay()===6?1:2);return map.get(friday);} }
  const rows=[]; const excluded={training:0,model:0,incompleteOutcome:0,incompleteHorizon:0,baseline:0};
  for(let year=Number(start.slice(0,4))+5;year<=Number(asOf.slice(0,4));year++) for(let month=0;month<12;month++) {
    const origin=new Date(Date.UTC(year,month,15)).toISOString().slice(0,10); if(day(origin)>cutoff)continue;
    const now=Date.parse(`${origin}T23:59:59+08:00`);
    // Conservative one-date lag: same-date reference publications / UTC closes are withheld.
    const training=points.filter(p=>p.date<origin);
    const latest=training.at(-1); const boundary=new Date(`${origin}T00:00:00Z`);boundary.setUTCFullYear(year-5);const first=day(boundary.toISOString().slice(0,10));
    const train=training.filter(p=>day(p.date)>=first);
    if(!latest || day(origin)-day(latest.date)>3 || !train.length || day(train[0].date)-first>7) {excluded.training++;continue;}
    for(const margin of [.01,.03,.05]) {
      const target=latest.rate*(1+margin); let forecast, oneYear;
      try {forecast=estimateForecast(training,target,[],now,{years:5,weekdaysOnly});oneYear=estimateForecast(training,target,[],now,{years:1,weekdaysOnly});}catch {excluded.model++;continue;}
      for(let h=0;h<forecast.windows.length;h++) {
        const window=forecast.windows[h]; if(window.end>cutoff || window.end>day(points.at(-1).date)) {excluded.incompleteHorizon++;continue;}
        const values=Array.from({length:window.end-window.start+1},(_,i)=>observed(window.start+i));
        if(values.some(v=>v===undefined)) {excluded.incompleteOutcome++;continue;}
        const y=Number(values.some(v=>v>=target));
        const delay=window.start-day(latest.date); const length=values.length; const past=[];
        // Match the forecast's delay from the known starting quote; preserve actual serial returns.
        for(const anchor of train) {
          const a=day(anchor.date); const from=a+delay, end=from+length-1;
          if(end>day(latest.date))continue;
          let valid=true,hit=false;
          for(let d=from;d<=end;d++) {const v=observed(d);if(v===undefined){valid=false;break;}if(v>=anchor.rate*(1+margin))hit=true;}
          if(valid)past.push(Number(hit));
        }
        if(past.length<30) {excluded.baseline++;continue;}
        rows.push({origin,horizon:window.label,margin,target,trainingStart:forecast.historyStart,trainingEnd:latest.date,observations:forecast.observations,from:date(window.start),to:date(window.end),p:window.percent/100,y,oneYear:oneYear.windows[h].percent/100,frequency:mean(past),baselineWindows:past.length});
      }
    }
    if(month===11)console.log(`${provider}: completed origins through ${year}`);
  }
  assert.ok(rows.length>0);
  assert.ok(rows.every(r=>r.trainingEnd<r.origin && r.to<asOf && r.p>=0 && r.p<=1));
  const byHorizon=Object.fromEntries(['This month','Next month','Next 3 months'].map(h=>{const subset=rows.filter(r=>r.horizon===h);assert.ok(subset.length);return[h,{...summarize(subset),ci6months:intervals(subset),ci12months:intervals(subset,12)}];}));
  const calibration=Array.from({length:5},(_,i)=>{const subset=rows.filter(r=>r.p>=i/5 && (i===4?r.p<=1:r.p<(i+1)/5));return{bin:`${i*20}–${(i+1)*20}%`,cases:subset.length,meanProbability:mean(subset.map(r=>r.p)),hitRate:mean(subset.map(r=>r.y))};});
  results[provider]={data:{source:saved.source,fetchedAt:saved.fetchedAt,first:points[0].date,last:points.at(-1).date,count:points.length,sha256:createHash('sha256').update(JSON.stringify(saved.points)).digest('hex')},excluded,byHorizon,byMargin:Object.fromEntries([.01,.03,.05].map(m=>[m,summarize(rows.filter(r=>r.margin===m))])),calibration,rows};
  console.log(JSON.stringify({provider,byHorizon},null,2));
}
const report={asOf,modelSha256:createHash('sha256').update(source).digest('hex'),paths:PATH_COUNT,results};
await fs.writeFile('devpost/validation/forecast-five-year.json',JSON.stringify(report,null,2)+'\n');
const pct=x=>x===null?'—':`${(x*100).toFixed(1)}%`; const num=x=>x===null?'—':x.toFixed(3); const ci=a=>`[${a.map(x=>x.toFixed(4)).join(', ')}]`;
const lines=['# Five-year forecast backtest','',`Cutoff: ${asOf}, Kuala Lumpur. Only outcomes before this date are scored.`, '', '## Summary', '', `Across ${Object.values(results).reduce((n,r)=>n+r.rows.length,0).toLocaleString()} scored cases (${results.frankfurter.rows.length} Frankfurter, ${results.twelve.rows.length} Twelve Data), compare the calibration tables and paired uncertainty intervals below. Cases are correlated, not independent trials. ${Object.values(results).flatMap(r=>Object.values(r.byHorizon)).every(v=>v.ci6months.deltaOneYear[0]<=0 && v.ci6months.deltaOneYear[1]>=0) ? 'Every six-month-block interval for the Brier difference from the one-year model spans zero; improved accuracy from five years is not established.' : 'Some one-year score differences exclude zero; check direction and twelve-month sensitivity.'} The historical-frequency baseline has a lower point-estimate Brier score in ${Object.values(results).flatMap(r=>Object.values(r.byHorizon)).filter(v=>v.frequencyBrier<v.brier).length} of six provider/horizon comparisons.`, '', '## Design', '', '- Frozen five-year implementation, run directly from the app source; 2,000 paths per case. No fitting or probability correction is performed.', '- Monthly origins on the 15th, targets 1%, 3%, and 5% above the last known rate. A full five-year span is required before each origin, with up to seven days allowed at the left boundary for closures.', '- All same-date observations are withheld (one-date publication lag). Only complete outcome windows are included. Twelve Data uses weekday closes; Friday values carry through weekends, exactly matching the model’s flat-weekend assumption. No missing weekday prices are filled.', '- Frankfurter uses calendar-day reference observations. Each provider is scored against its own observations: these scores are not a head-to-head comparison of identical market outcomes.', '- News is disabled because no point-in-time headline archive was supplied. This evaluates rate-only estimates, not the complete news-adjusted product or MiroFish.', '- Baselines: no-change (0% for these positive targets), the app’s one-year model with the same provider/calendar, and historical hit frequency over complete windows within the five-year training history. Historical frequency matches horizon length and delay from the starting quote; all baseline outcomes precede the origin.', '', '## Metrics and uncertainty', '', 'Brier score is mean squared probability error (lower is better). Bias is mean predicted probability minus observed hit frequency. Skill = 1 − model Brier / historical-frequency Brier. AUROC measures ranking, not calibration. Log loss uses probabilities clipped to [1/4000, 3999/4000], so exact 0/100% simulation outcomes do not create infinite scores.', '', 'Intervals are approximate 95% percentile circular moving-block bootstrap intervals (2,000 draws), resampling six-month groups of forecast origins while retaining all target cases in each origin. Twelve-month blocks are a dependence sensitivity check. Intervals reflect historical sampling variability, not confidence intervals for an individual future prediction. Small numbers of regimes and history revisions limit inference. No independent-case binomial intervals or significance claims are used.', '', 'With 2,000 independent simulated paths, nominal Monte Carlo standard error is at most 1.12 percentage points (about ±2.2 points at 95%). That only measures simulation noise conditional on the model—not forecasting accuracy.', ''];
for(const [provider,r] of Object.entries(results)) {
 lines.push(`## ${provider==='twelve'?'Twelve Data':'Frankfurter'}`, '', `Historical observations: ${r.data.first}–${r.data.last}; ${r.data.count} usable source observations. Retrieved ${r.data.fetchedAt}.`, '', '| Horizon | Cases / origins | Mean estimate | Actual hits | Brier | Frequency baseline | One-year model | No-change | Skill |','|---|---:|---:|---:|---:|---:|---:|---:|---:|',...Object.entries(r.byHorizon).map(([h,v])=>`| ${h} | ${v.cases} / ${v.origins} | ${pct(v.meanProbability)} | ${pct(v.hitRate)} | ${num(v.brier)} | ${num(v.frequencyBrier)} | ${num(v.oneYearBrier)} | ${num(v.noChangeBrier)} | ${pct(v.skillVsFrequency)} |`), '', '### Uncertainty and discrimination', '', 'Δ Brier = five-year model minus baseline; negative favors five years. An interval spanning zero does not establish improvement.', '', '| Horizon | Brier 95% interval (6m) | Δ vs frequency (6m) | Δ vs one-year (6m) | Δ vs frequency (12m) | Bias interval (6m) | AUROC | Log loss |','|---|---:|---:|---:|---:|---:|---:|---:|',...Object.entries(r.byHorizon).map(([h,v])=>`| ${h} | ${ci(v.ci6months.brier)} | ${ci(v.ci6months.deltaFrequency)} | ${ci(v.ci6months.deltaOneYear)} | ${ci(v.ci12months.deltaFrequency)} | ${ci(v.ci6months.bias)} | ${num(v.auc)} | ${num(v.logLoss)} |`), '', '### Calibration (all horizons and targets pooled)', '', '| Predicted bin | Cases | Mean predicted | Observed hits |','|---|---:|---:|---:|',...r.calibration.map(v=>`| ${v.bin} | ${v.cases} | ${pct(v.meanProbability)} | ${pct(v.hitRate)} |`), '', '### Target sensitivity (all horizons pooled)', '', '| Target above starting rate | Cases | Mean predicted | Observed hits | Model Brier | Frequency Brier |','|---|---:|---:|---:|---:|---:|',...Object.entries(r.byMargin).map(([m,v])=>`| ${pct(Number(m))} | ${v.cases} | ${pct(v.meanProbability)} | ${pct(v.hitRate)} | ${num(v.brier)} | ${num(v.frequencyBrier)} |`), '', `Excluded counters (training counts origins; others count target/horizon attempts): ${JSON.stringify(r.excluded)}.`, '', `Data SHA-256: ${r.data.sha256}.`, '');
}
lines.push('## Interpretation and limits', '', '- Use the calibration tables and paired score differences together. More history is not automatically a better probability model. Do not convert these observed hit frequencies directly into user-facing probabilities.', '- Outcomes are daily reference/closing-rate hits, not intraday highs, spreads, or executable retail exchange rates. Weekend carry in the Twelve Data model is a convention, not weekend tradability.', '- Forecast windows and five-year training windows overlap heavily. Targets share paths and outcomes. Bootstrap blocks reduce but cannot eliminate dependence; six- and twelve-month results should be considered together.', '- Data were downloaded now, not from historical publication vintages. The lag reduces same-date look-ahead but does not establish original availability or remove revisions/survivorship effects.', '- Prior work already inspected parts of this history. This is retrospective evaluation of the newly fixed five-year model, not an untouched holdout. Do not tune and then cite these results as independent validation.', '- No future live data were scored. Validate any calibration/model changes on a fresh chronological holdout or prospective forecasts before claiming reliable probabilities.', '- Strict complete-outcome selection can favor well-covered periods. Exclusion counts are disclosed; no unknown outcomes are imputed.', '', '## Statistical references', '', '- [Gneiting & Raftery (2007): Strictly Proper Scoring Rules, Prediction, and Estimation](https://sites.stat.washington.edu/people/raftery/Research/PDF/Gneiting2007jasa.pdf), for probability scoring and calibration principles.', '- [DasGupta: The Bootstrap](https://www.stat.purdue.edu/~dasgupta/bootstrap.pdf), for bootstrap inference including dependent observations. The 6/12-month block choices here are sensitivity settings, not estimated optimal block lengths.', '', '## Reproduce', '', `Run \`node scripts/backtest-five-year.mjs --as-of=${asOf}\`. Private provider snapshots are cached in ignored \`.cache/backtest/\`; the Twelve Data key stays in ignored \`.env.local\`. No key is stored in the report. Results and case-level probabilities are in \`forecast-five-year.json\`. Provider revisions can change a fresh download; compare snapshot hashes.`, '', `App model SHA-256: ${report.modelSha256}.`, '');
await fs.writeFile('devpost/validation/forecast-five-year.md',lines.join('\n'));
console.log('Saved devpost/validation/forecast-five-year.md');
