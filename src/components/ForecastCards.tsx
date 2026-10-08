import { useEffect, useMemo, useState } from 'react';
import type { NewsSnapshot, RateSnapshot } from '../types';
import { estimateForecast, forecastWindows, formatForecastPercent, PATH_COUNT } from '../lib/forecast';
import { fetchPeriodRates, readCachedPeriodRates, isRateStale, formatObservationDate, formatRate } from '../lib/rates';
import { isNewsStale } from '../lib/news';

const HISTORY_KEY = 'forecast-five-years-v1';
const TARGET_KEY = 'ringgitwon-personal-target';
const dateLabel = (day: number) => formatObservationDate(new Date(day * 86_400_000).toISOString().slice(0, 10));

export function ForecastCards({ rates, news, lastRefresh }: { rates: RateSnapshot | null; news: NewsSnapshot | null; lastRefresh: string | null }) {
  const [history, setHistory] = useState<RateSnapshot | null>(() => readCachedPeriodRates(HISTORY_KEY));
  const [source, setSource] = useState<'frankfurter' | 'twelve'>('frankfurter');
  const [twelveHistory, setTwelveHistory] = useState<RateSnapshot | null>(null);
  const [historyErrors, setHistoryErrors] = useState({ frankfurter: '', twelve: '' });
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(() => {
    try { const saved = Number(localStorage.getItem(TARGET_KEY)); return saved > 0 && Number.isFinite(saved) ? saved : 350; } catch { return 350; }
  });
  const [draft, setDraft] = useState(String(target));
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  const today = new Date(now + 8 * 3_600_000).toISOString().slice(0, 10);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const start = new Date(`${today}T00:00:00Z`); start.setUTCFullYear(start.getUTCFullYear() - 5);
    const frankfurter = fetchPeriodRates(HISTORY_KEY, start.toISOString().slice(0, 10), today).then(snapshot => {
      if (active) { setHistory(snapshot); setHistoryErrors(errors => ({ ...errors, frankfurter: '' })); }
    }).catch(reason => { if (active) setHistoryErrors(errors => ({ ...errors, frankfurter: reason instanceof Error ? reason.message : 'History unavailable.' })); });
    const twelve = (async () => {
      try {
        const response = await fetch('/api/rate-history', { signal: AbortSignal.timeout(25_000) });
        const body = await response.json();
        const snapshot = body.snapshot as RateSnapshot | null;
        if (snapshot && (!Array.isArray(snapshot.points) || !snapshot.points.length || !Number.isFinite(Date.parse(snapshot.fetchedAt)) || snapshot.points.some(p => !/^\d{4}-\d{2}-\d{2}$/.test(p.date) || !Number.isFinite(p.rate) || p.rate <= 0))) throw new Error('Invalid Twelve Data history.');
        if (active && snapshot) setTwelveHistory(snapshot);
        if (!response.ok || body.error || !snapshot) throw new Error(typeof body.error === 'string' ? body.error : 'Twelve Data history unavailable.');
        if (active) setHistoryErrors(errors => ({ ...errors, twelve: '' }));
      } catch (reason) { if (active) setHistoryErrors(errors => ({ ...errors, twelve: reason instanceof Error ? reason.message : 'Twelve Data history unavailable.' })); }
    })();
    void Promise.allSettled([frankfurter, twelve]).then(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [lastRefresh, today]);
  const selectedHistory = source === 'twelve' ? twelveHistory : history;
  const sourceLabel = source === 'twelve' ? 'Twelve Data' : 'Frankfurter';
  const calculation = useMemo(() => {
    if (isRateStale(selectedHistory, now)) return { message: 'Current forecast unavailable: use Refresh at the top of the page to update rate history.' };
    if (isNewsStale(news, now) || !news?.articles.length) return { message: 'Current forecast unavailable: recent news is missing or out of date.' };
    try {
      const points = source === 'twelve' ? selectedHistory!.points : [...selectedHistory!.points, ...(rates?.points ?? [])];
      return { result: estimateForecast(points, target, news.articles, now, { years: 5, weekdaysOnly: source === 'twelve' }) };
    } catch (reason) { return { message: reason instanceof Error ? reason.message : 'Forecast unavailable.' }; }
  }, [selectedHistory, source, rates, news, target, now]);
  const result = calculation.result;
  return <section className="forecast-panel" id="forecast" aria-label="Target forecasts">
    <div className="section-title-row"><div><span className="section-kicker">02 / PLAN THE EXCHANGE</span><h2>Your target, three horizons</h2></div><span className="freshness is-stale">EXPERIMENTAL</span></div>
    <form className="forecast-target" onSubmit={event => {
      event.preventDefault(); const value = Number(draft);
      if (!Number.isFinite(value) || value <= 0) { setError('Enter a target greater than zero.'); return; }
      setTarget(value); setError('');
      try { localStorage.setItem(TARGET_KEY, String(value)); } catch { setError('Target works for this visit; browser storage is unavailable.'); }
    }}>
      <label>PERSONAL TARGET · KRW / RM1<input type="number" min="0.01" step="0.01" required value={draft} onChange={event => setDraft(event.target.value)} /></label>
      <button type="submit">SET TARGET</button>
    </form>
    <p className="forecast-caption">Minimum {formatRate(target)} KRW per RM1 · Personal planning target; your room keeps its own shared target.</p>
    <div className="surveillance-tabs" role="group" aria-label="Simulation history source">
      <button type="button" aria-pressed={source === 'frankfurter'} className={source === 'frankfurter' ? 'is-selected' : ''} onClick={() => setSource('frankfurter')}>FRANKFURTER</button>
      <button type="button" aria-pressed={source === 'twelve'} className={source === 'twelve' ? 'is-selected' : ''} onClick={() => setSource('twelve')}>TWELVE DATA</button>
    </div>
    <p className="forecast-caption">Five-year history window · {source === 'twelve' ? <a href="https://twelvedata.com" target="_blank" rel="noopener noreferrer">Twelve Data</a> : 'Frankfurter'} · {source === 'twelve' ? 'completed daily closes (UTC), weekdays only' : 'daily reference observations'}. Each source runs its own simulation.{loading ? ' Updating history…' : ''}</p>
    {result && <p className="forecast-caption">{sourceLabel.toUpperCase()} · AVAILABLE HISTORY · {formatObservationDate(result.historyStart)} – {formatObservationDate(result.latest.date)} · {result.observations} available observations · {result.excludedGaps} gaps excluded</p>}
    {historyErrors[source] && <p className="stale-note" role="status">{historyErrors[source]} {result ? 'Using the last available history.' : ''}</p>}
    {(error || calculation.message) && <p className="stale-note" role="status">{error} {calculation.message}</p>}
    <div className="forecast-grid">
      {(result?.windows ?? forecastWindows(now)).map((window, index) => {
        const percent = result?.windows[index].percent;
        const estimate = result?.windows[index];
        return <article className="forecast-card" key={window.label}>
          <span className="section-kicker">{window.label}</span><p className="forecast-dates">{dateLabel(window.start)} – {dateLabel(window.end)}</p>
          <strong className="forecast-percent">{percent === undefined ? '—' : formatForecastPercent(percent)}</strong><p className="forecast-caption">estimated target-reaching probability under this model</p>
          {estimate && <p className="forecast-caption">{estimate.hits.toLocaleString()} of {estimate.paths.toLocaleString()} simulated paths reach your target.{estimate.hits === 0 ? ' No hits in this run does not mean impossible.' : estimate.hits === estimate.paths ? ' Every path reached it in this run; this is not a guarantee.' : ''}</p>}
          <div className="pixel-meter" role="img" aria-label={percent === undefined ? 'Estimate unavailable' : `${percent} percent on a zero to one hundred scale`}>
            {Array.from({ length: 20 }, (_, i) => <i key={i} className={percent !== undefined && i < Math.round(percent / 5) ? 'is-filled' : ''} />)}
          </div>
          {result && <small>Rate observed {formatObservationDate(result.latest.date)}.<br />News checked {new Date(news!.fetchedAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })} MYT.</small>}
        </article>;
      })}
    </div>
    <details className="forecast-method"><summary>How these estimates work</summary>
      {result && <>
        <p>{result.returnSamples} {source === 'twelve' ? 'successive weekday closing changes' : 'consecutive-day changes'}; average daily change {(100 * Math.expm1(result.mean)).toFixed(2)}%, daily variation {(100 * result.volatility).toFixed(2)}%.</p>
        <p>{result.signal.matches ? `${result.signal.matches} directional headline matches; a small, fading news adjustment is included.` : 'No directional headline matches. News adjustment is neutral.'}</p>
        {result.signal.articles.length > 0 ? <ul>{result.signal.articles.map(article => <li key={article.url}><a href={article.url} target="_blank" rel="noreferrer">{article.title} ↗</a></li>)}</ul> : <p>No currency-specific articles returned by the news feed.</p>}
      </>}
      <p>Estimated probability = paths that reach or exceed your target ÷ {PATH_COUNT.toLocaleString()} paths × 100. The calculation samples daily changes from the selected provider’s past five years of available history to generate possible future paths; it does not train a machine-learning model.</p><p>{PATH_COUNT.toLocaleString()} simulated paths sample changes by weekday. {source === 'twelve' ? 'Twelve Data uses completed weekday closes: Friday-to-Monday is one Monday change; simulated rates stay flat on weekends. Weekend bars and gaps across missing weekdays are excluded. These estimates count daily-close target hits, not intraday touches.' : 'Frankfurter advances every calendar day, including weekends, using consecutive-day observations. Returns spanning missing dates are excluded.'} At least eight changes per modeled weekday are required. Holidays are not modeled separately. Each window counts only touches within its own calendar dates in Kuala Lumpur. The next three months are three full months after this month. The calculation assumes past changes remain representative and treats sampled changes as independent; it may miss new market conditions and prolonged trends.</p><p>The English headline heuristic recognizes “ringgit/MYR rises, gains, strengthens” and “Korean won/KRW falls, weakens, drops” as positive, and the reverse as negative. Other headlines have no directional effect. The adjustment is applied only on weekdays, capped at ±0.005% per day and fades over 14 calendar days. This simple rule cannot understand context or causality.</p></details>
    <p className="forecast-caption">Experimental scenarios. The five-year variants have not been backtested or calibrated; prior one-year evaluation found target-hit underestimation; these percentages are not calibrated real-world probabilities. Past changes may not repeat. Even 100% of simulated paths is no guarantee, and 0% does not mean impossible.</p>
  </section>;
}
