import { useCallback, useEffect, useRef, useState } from 'react';

export type IntradayQuote = { rate: number; observedAt: string; fetchedAt: string; source: 'Twelve Data'; symbol: 'MYR/KRW' };
export const INTRADAY_STALE_MS = 10 * 60_000;
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
  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true; setLoading(true);
    try {
      const response = await fetch('/api/intraday-rate', { signal: AbortSignal.timeout(12_000) });
      const body = await response.json();
      if (typeof body.configured !== 'boolean') throw new Error('Intraday API is unavailable. The app needs its server endpoint.');
      setConfigured(body.configured);
      if (body.quote) {
        const q = body.quote as IntradayQuote;
        if (q.symbol !== 'MYR/KRW' || q.source !== 'Twelve Data' || !Number.isFinite(q.rate) || q.rate <= 0 || !Number.isFinite(Date.parse(q.observedAt)) || !Number.isFinite(Date.parse(q.fetchedAt))) throw new Error('Invalid intraday quote.');
        if (!latest.current || q.observedAt > latest.current.observedAt) {
          setPrevious(latest.current); latest.current = q; setQuote(q);
        }
      }
      setError(typeof body.error === 'string' ? body.error : !response.ok ? 'Intraday quote unavailable.' : null);
      if (!body.configured) { latest.current = null; setQuote(null); setPrevious(null); }
    } catch { setError('Intraday quote could not be refreshed. Check the server connection.'); }
    finally { busy.current = false; setLoading(false); setNow(Date.now()); }
  }, []);
  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 5 * 60_000);
    const clock = window.setInterval(() => setNow(Date.now()), 30_000);
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(poll); clearInterval(clock); document.removeEventListener('visibilitychange', visible); };
  }, [refresh]);
  return { quote, previous, configured, error, loading, refresh, fresh: !error && quoteFresh(quote, now) };
}
