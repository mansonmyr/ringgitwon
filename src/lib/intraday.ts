import { useCallback, useEffect, useRef, useState } from 'react';

export type IntradayQuote = { rate: number; observedAt: string; fetchedAt: string; source: 'Twelve Data'; symbol: 'MYR/KRW' };
export const INTRADAY_STALE_MS = 60 * 60_000;
export function quoteFresh(quote: IntradayQuote | null, now = Date.now()) {
  if (!quote) return false;
  const age = now - Date.parse(quote.observedAt);
  return Number.isFinite(age) && age >= -120_000 && age <= INTRADAY_STALE_MS;
}
export function quoteTime(date: string) {
  return new Date(date).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function useIntradayRate() {
  const [quote, setQuote] = useState<IntradayQuote | null>(null);
  const [previous, setPrevious] = useState<IntradayQuote | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now);
  const latest = useRef<IntradayQuote | null>(null);
  const busy = useRef(false);
  const refresh = useCallback(async (force = false) => {
    if (busy.current) return;
    if (!force && latest.current && Date.now() - Date.parse(latest.current.fetchedAt) < 15 * 60_000) {
      return;
    }
    busy.current = true; setLoading(true);
    try {
      const response = await fetch('/api/intraday-rate', { signal: AbortSignal.timeout(12_000) });
      const body = await response.json();
      if (typeof body.configured !== 'boolean') throw new Error('Market rate service is unavailable.');
      setConfigured(body.configured);
      if (body.quote) {
        const q = body.quote as IntradayQuote;
        if (q.symbol !== 'MYR/KRW' || q.source !== 'Twelve Data' || !Number.isFinite(q.rate) || q.rate <= 0 || !Number.isFinite(Date.parse(q.observedAt)) || !Number.isFinite(Date.parse(q.fetchedAt))) throw new Error('Invalid market rate.');
        if (!latest.current || q.observedAt > latest.current.observedAt) {
          setPrevious(latest.current); latest.current = q; setQuote(q);
        }
      }
      setError(typeof body.error === 'string' ? body.error : !response.ok ? 'Market rate unavailable.' : null);
      if (!body.configured) { latest.current = null; setQuote(null); setPrevious(null); }
    } catch { setError('Market rate could not be refreshed. Check the server connection.'); }
    finally { busy.current = false; setLoading(false); setNow(Date.now()); }
  }, []);
  useEffect(() => {
    let active = true;
    let poll: number | undefined;
    const schedule = async () => {
      if (document.visibilityState === 'visible') await refresh();
      if (active) poll = window.setTimeout(() => void schedule(), 30 * 60_000);
    };
    void schedule();
    const clock = window.setInterval(() => setNow(Date.now()), 30_000);
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { active = false; clearTimeout(poll); clearInterval(clock); document.removeEventListener('visibilitychange', visible); };
  }, [refresh]);
  return { quote, previous, configured, error, loading, refresh, fresh: !error && quoteFresh(quote, now) };
}
