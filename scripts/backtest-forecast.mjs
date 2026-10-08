import fs from 'node:fs/promises';
import ts from 'typescript';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Run the same forecast implementation used by the app, without a second model.
const source = await fs.readFile(new URL('../src/lib/forecast.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { estimateForecast, forecastWindows, PATH_COUNT } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const asOf = process.argv.find(arg => arg.startsWith('--as-of='))?.slice(8);
if (!asOf || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error('Supply --as-of=YYYY-MM-DD in Kuala Lumpur time.');
const output = new URL('../devpost/validation/', import.meta.url);
await fs.mkdir(output, { recursive: true });
const start = `${Number(asOf.slice(0, 4)) - 4}-01-01`;
const url = new URL('https://api.frankfurter.dev/v2/rates');
for (const [key, value] of Object.entries({ base: 'EUR', quotes: 'MYR,KRW', from: start, to: asOf })) url.searchParams.set(key, value);
const dataFile = new URL(`rates-${asOf}.json`, output);
let saved;
try { saved = JSON.parse(await fs.readFile(dataFile, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!saved) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Frankfurter HTTP ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Unexpected rate response.');
  const dates = new Map();
  for (const row of rows) {
    if (row.base !== 'EUR' || !['MYR', 'KRW'].includes(row.quote) || !Number.isFinite(row.rate) || row.rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) throw new Error('Invalid provider row; refusing to score.');
    const entry = dates.get(row.date) ?? {};
    if (entry[row.quote] !== undefined) throw new Error('Duplicate date/quote returned; choose a consistent provider before scoring.');
    entry[row.quote] = row.rate; dates.set(row.date, entry);
  }
  const points = [...dates].flatMap(([date, quotes]) => quotes.MYR && quotes.KRW ? [{ date, rate: quotes.KRW / quotes.MYR }] : []).sort((a, b) => a.date.localeCompare(b.date));
  saved = { source: url.toString(), fetchedAt: new Date().toISOString(), points };
  await fs.writeFile(dataFile, JSON.stringify(saved, null, 2) + '\n');
}
const points = saved.points;
assert.equal(saved.source, url.toString(), 'Cached data must match the requested source and date range.');
assert.ok(points.every((p, i) => Number.isFinite(p.rate) && p.rate > 0 && p.date >= start && p.date <= asOf && (!i || points[i - 1].date < p.date)), 'Rates must be finite, positive, unique, chronological and in range.');
if (points.length < 300) throw new Error('Insufficient historical data for evaluation.');
const DAY = 86_400_000;
const margins = [0.01, 0.03, 0.05];
const rows = [];
// One origin per month, evaluated at the end of the 15th in Kuala Lumpur.
// A one-year training window; only fully observed forecast windows are scored.
for (let year = Number(start.slice(0, 4)) + 1; year <= Number(asOf.slice(0, 4)); year++) {
  for (let month = 0; month < 12; month++) {
    const origin = new Date(Date.UTC(year, month, 15)).toISOString().slice(0, 10);
    if (origin > asOf) continue;
    const now = Date.parse(`${origin}T23:59:59+08:00`);
    const training = points.filter(point => point.date <= origin);
    const latest = training.at(-1);
    if (!latest || (Date.parse(origin) - Date.parse(latest.date)) / DAY > 3) continue;
    for (const margin of margins) {
      const target = latest.rate * (1 + margin);
      const forecast = estimateForecast(training, target, [], now);
      for (const window of forecast.windows) {
        const from = new Date(window.start * DAY).toISOString().slice(0, 10);
        const to = new Date(window.end * DAY).toISOString().slice(0, 10);
        if (to >= asOf || to > points.at(-1).date) continue;
        const actual = points.filter(point => point.date >= from && point.date <= to);
        // Require endpoint coverage; no interpolation or filled weekends.
        if (!actual.length || Date.parse(actual[0].date) - Date.parse(from) > 4 * DAY || Date.parse(to) - Date.parse(actual.at(-1).date) > 4 * DAY) continue;
        const outcome = Number(actual.some(point => point.rate >= target));
        // A simple historical-frequency baseline: same-length windows from
        // the trailing training year, with the target relative to each start.
        const days = window.end - window.start + 1;
        const delay = window.start - Date.parse(origin) / DAY;
        const trainingYear = training.filter(point => point.date >= forecast.historyStart);
        const historicalOutcomes = [];
        for (const anchor of trainingYear) {
          const anchorTime = Date.parse(anchor.date);
          const startTime = anchorTime + delay * DAY;
          const endTime = startTime + (days - 1) * DAY;
          if (endTime > Date.parse(latest.date)) continue;
          const sample = trainingYear.filter(point => Date.parse(point.date) >= startTime && Date.parse(point.date) <= endTime);
          if (sample.length < Math.max(1, days * 0.5)) continue;
          historicalOutcomes.push(Number(sample.some(point => point.rate >= anchor.rate * (1 + margin))));
        }
        const baseline = historicalOutcomes.length ? historicalOutcomes.reduce((a, b) => a + b, 0) / historicalOutcomes.length : null;
        rows.push({ origin, horizon: window.label, targetMargin: margin, target, from, to, trainingStart: forecast.historyStart, trainingEnd: latest.date, observations: forecast.observations, probability: window.percent / 100, hits: window.hits, paths: PATH_COUNT, outcome, baseline });
      }
    }
  }
}
const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
const summarize = list => ({ cases: list.length, meanProbability: mean(list.map(row => row.probability)), hitRate: mean(list.map(row => row.outcome)), brier: mean(list.map(row => (row.probability - row.outcome) ** 2)), noChangeBrier: mean(list.map(row => row.outcome ** 2)), historicalFrequencyBrier: mean(list.filter(row => row.baseline !== null).map(row => (row.baseline - row.outcome) ** 2)) });
const horizons = forecastWindows(Date.parse(`${asOf}T12:00:00+08:00`)).map(window => window.label);
const byHorizon = Object.fromEntries(horizons.map(horizon => [horizon, summarize(rows.filter(row => row.horizon === horizon))]));
const calibration = Array.from({ length: 5 }, (_, i) => {
  const list = rows.filter(row => row.probability >= i / 5 && (i === 4 ? row.probability <= 1 : row.probability < (i + 1) / 5));
  return { bin: `${i * 20}–${(i + 1) * 20}%`, ...(list.length ? summarize(list) : { cases: 0 }) };
});
const weekendObservations = points.filter(point => [0, 6].includes(new Date(point.date).getUTCDay())).length;
assert.ok(rows.length > 0 && rows.every(row => row.trainingEnd <= row.origin && row.to < asOf && row.probability >= 0 && row.probability <= 1), 'Backtest must use prior inputs and complete outcomes.');
const report = { asOf, forecastSourceSha256: createHash('sha256').update(source).digest('hex'), weekendObservations, source: saved.source, fetchedAt: saved.fetchedAt, history: { start: points[0].date, end: points.at(-1).date, count: points.length }, newsAdjustment: 'Disabled: no point-in-time news archive supplied. Does not validate the news heuristic.', byHorizon, calibration, rows };
await fs.writeFile(new URL('forecast-backtest.json', output), JSON.stringify(report, null, 2) + '\n');
const pct = value => `${(100 * value).toFixed(1)}%`;
const score = value => value.toFixed(3);
const lines = [ '# Forecast backtest', '', `Evaluation cutoff: **${asOf} (Kuala Lumpur)**.`, '', `[Rate source](${saved.source}) · retrieved ${saved.fetchedAt}.`, '', `Data: ${points[0].date}–${points.at(-1).date}, ${points.length} matched MYR/KRW observations.`, '', '## Method', '', `The app’s unchanged ${PATH_COUNT}-path simulator is run from monthly historical origins, each using only its trailing year of data. Targets are 1%, 3%, and 5% above the rate known at that origin. Only complete future windows are scored. The outcome is whether an observed daily reference rate reaches the target; this does not measure intraday or retail cash rates.`, '', 'News adjustment is disabled: no archived news available at each historical origin was supplied. This evaluates the rate-only simulation, not the news heuristic or MiroFish.', '', '## Results', '', 'Brier score is average squared probability error; lower is better. No-change predicts zero chance for these above-current targets. Historical frequency estimates target hits from the training year, using each forecast’s window length and calendar-day delay. It remains a simple comparator rather than a fitted model.', '', '| Window | Cases | Mean estimate | Actual hit rate | Model Brier | No-change Brier | Historical frequency Brier |', '|---|---:|---:|---:|---:|---:|---:|', ...Object.entries(byHorizon).map(([horizon, value]) => `| ${horizon} | ${value.cases} | ${pct(value.meanProbability)} | ${pct(value.hitRate)} | ${score(value.brier)} | ${score(value.noChangeBrier)} | ${score(value.historicalFrequencyBrier)} |`), '', '## Calibration across all windows', '', '| Estimate bin | Cases | Mean estimate | Actual hit rate |', '|---|---:|---:|---:|', ...calibration.map(value => `| ${value.bin} | ${value.cases} | ${value.cases ? pct(value.meanProbability) : '—'} | ${value.cases ? pct(value.hitRate) : '—'} |`), '', '## Findings', '', 'The model underestimates the aggregate target-hit frequency in all three horizons in this sample. It is not calibrated enough to present as a reliable real-world probability. Results do not justify replacing the displayed probabilities with the observed hit rates.', '', `Data diagnostic: ${weekendObservations} returned observations fall on weekends, while the current simulator advances on weekdays only. The provider publication calendar and this model assumption need reconciling in a separately evaluated revision; this report preserves the existing model.`, '', '## Limits', '', '- Origins, horizons and target levels overlap, so cases are correlated. Counts are not independent evidence; no confidence interval or accuracy guarantee is claimed.', '- This is an exploratory backtest, not an untouched holdout. Changes selected after seeing this report need a fresh later evaluation period.', '- Provider history may contain revisions; this download is not a vintage data archive. End-of-origin-day availability is assumed.', '- Missing publication days are left blank; incomplete endpoint coverage is excluded. No historical prices or outcomes are fabricated.', '- The model samples independent daily changes and may miss volatility clustering, regime changes, and persistent trends.', '- Headline and MiroFish influence needs a separate dated-evidence evaluation before it can adjust probabilities.', '', `Forecast source SHA-256: ${report.forecastSourceSha256}.`, '', 'Reproduce: `node scripts/backtest-forecast.mjs --as-of=' + asOf + '`. The local rates snapshot is reused; raw case results are in `forecast-backtest.json`.', '' ];
await fs.writeFile(new URL('forecast-backtest.md', output), lines.join('\n'));
console.log(JSON.stringify({ report: 'devpost/validation/forecast-backtest.md', ...byHorizon, calibration }, null, 2));
