import { useEffect, useMemo, useState } from 'react';
import type { NewsSnapshot, RateSnapshot } from '../types';
import { estimateForecast, forecastWindows, formatForecastPercent, PATH_COUNT } from '../lib/forecast';
import { fetchPeriodRates, readCachedPeriodRates, isRateStale, formatObservationDate, formatRate } from '../lib/rates';
import { isNewsStale } from '../lib/news';

const HISTORY_KEY = 'forecast-year';
const TARGET_KEY = 'ringgitwon-personal-target';
const dateLabel = (day: number) => formatObservationDate(new Date(day * 86_400_000).toISOString().slice(0, 10));

export function ForecastCards({ rates, news, onRefresh }: { rates: RateSnapshot | null; news: NewsSnapshot | null; onRefresh: () => void }) {
  const [history, setHistory] = useState<RateSnapshot | null>(() => readCachedPeriodRates(HISTORY_KEY));
  const [target, setTarget] = useState(() => {
    try { const saved = Number(localStorage.getItem(TARGET_KEY)); return saved > 0 && Number.isFinite(saved) ? saved : 350; } catch { return 350; }
  });
  const [draft, setDraft] = useState(String(target));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let active = true;
    const end = new Date();
    const start = new Date(end); start.setUTCFullYear(start.getUTCFullYear() - 1);
    setLoading(true);
    void fetchPeriodRates(HISTORY_KEY, start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)).then(snapshot => {
      if (active) { setHistory(snapshot); setError(''); }
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'History unavailable.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [rates?.fetchedAt, retry]);
  const calculation = useMemo(() => {
    if (isRateStale(history, now) || isRateStale(rates, now)) return { message: 'Current forecast unavailable: refresh the rate history.' };
    if (isNewsStale(news, now) || !news?.articles.length) return { message: 'Current forecast unavailable: recent news is missing or out of date.' };
    try { return { result: estimateForecast([...(history?.points ?? []), ...(rates?.points ?? [])], target, news.articles, now) }; }
    catch (reason) { return { message: reason instanceof Error ? reason.message : 'Forecast unavailable.' }; }
  }, [history, rates, news, target, now]);
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
      <button type="button" disabled={loading} onClick={() => { setRetry(value => value + 1); onRefresh(); }}>{loading ? 'LOADING HISTORY…' : 'REFRESH INPUTS'}</button>
    </form>
    <p className="forecast-caption">Minimum {formatRate(target)} KRW per RM1 · Personal planning target; your room keeps its own shared target.</p>
    {result && <p className="forecast-caption">PAST-YEAR SIMULATION · {formatObservationDate(result.historyStart)} – {formatObservationDate(result.latest.date)} · {result.observations} available observations</p>}
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
          <h3>Why?</h3>
          {result ? <><p>{result.observations} observations; average daily change {(100 * Math.expm1(result.mean)).toFixed(2)}%, daily variation {(100 * result.volatility).toFixed(2)}%.</p><p>{result.signal.matches ? `${result.signal.matches} directional headline matches; a small, fading news adjustment is included.` : 'No directional headline matches. News adjustment is neutral.'}</p>
            {result.signal.articles.map(article => <a key={article.url} href={article.url} target="_blank" rel="noreferrer">{article.title} ↗</a>)}
            {!result.signal.articles.length && <p>No currency-specific articles returned by the news feed.</p>}
            <small>Rate observed {formatObservationDate(result.latest.date)}.<br />News checked {new Date(news!.fetchedAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })} MYT.</small>
          </> : <p>Fresh rate history and recent news are needed before an estimate can be shown.</p>}
        </article>;
      })}
    </div>
    <details className="forecast-method"><summary>How these estimates work</summary><p>Estimated probability = paths that reach or exceed your target ÷ {PATH_COUNT.toLocaleString()} paths × 100. The calculation samples daily changes from the past year to generate possible future paths; it does not train a machine-learning model.</p><p>{PATH_COUNT.toLocaleString()} simulated paths resample observed rate changes, advancing on weekdays. Holidays are not modeled. Each window counts only touches within its own calendar dates in Kuala Lumpur. The next three months are three full months after this month. The calculation assumes past changes remain representative and treats sampled changes as independent; it may miss new market conditions and prolonged trends.</p><p>The English headline heuristic recognizes “ringgit/MYR rises, gains, strengthens” and “Korean won/KRW falls, weakens, drops” as positive, and the reverse as negative. Other headlines have no directional effect. The adjustment is capped at ±0.005% per day and fades over 14 days. This simple rule cannot understand context or causality.</p></details>
    <p className="forecast-caption">Experimental, unvalidated scenarios—not a reliable probability or financial advice. Past changes may not repeat. Even 100% of simulated paths is no guarantee, and 0% does not mean impossible.</p>
  </section>;
}
