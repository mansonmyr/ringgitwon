import type { Connect } from 'vite';
import type { RateSnapshot } from '../src/types';

// One fixed historical request per server cache, never arbitrary client symbols/ranges.
export function twelveDataHistoryMiddleware(apiKey: string): Connect.NextHandleFunction {
  let snapshot: RateSnapshot | null = null;
  let error: string | null = null;
  let nextFetch = 0;
  let pending: Promise<void> | null = null;
  async function update() {
    try {
      const today = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
      const start = new Date(`${today}T00:00:00Z`);
      start.setUTCFullYear(start.getUTCFullYear() - 5);
      // Daily forex bars use UTC. Exclude the still-open UTC day.
      const end = new Date().toISOString().slice(0, 10);
      const from = start.toISOString().slice(0, 10);
      const url = new URL('https://api.twelvedata.com/time_series');
      url.search = new URLSearchParams({ symbol: 'MYR/KRW', interval: '1day', start_date: from, end_date: end, outputsize: '5000', order: 'asc' }).toString();
      const response = await fetch(url, { headers: { Authorization: `apikey ${apiKey}`, Accept: 'application/json' }, signal: AbortSignal.timeout(20_000) });
      const raw: unknown = await response.json();
      if (!raw || typeof raw !== 'object') throw new Error();
      const body = raw as Record<string, unknown>;
      if (!response.ok || body.status === 'error') {
        const code = Number(body.code ?? response.status);
        error = code === 429 ? 'Twelve Data history request limit reached. Try again later.' : 'Twelve Data history is unavailable. Check API key, MYR/KRW history access, and plan limits.';
        return;
      }
      const meta = body.meta as Record<string, unknown> | undefined;
      if (meta?.symbol !== 'MYR/KRW' || meta.interval !== '1day' || !Array.isArray(body.values)) throw new Error();
      const points = new Map<string, { date: string; rate: number }>();
      for (const row of body.values) {
        const date = row?.datetime;
        const rate = Number(row?.close);
        if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || !Number.isFinite(rate) || rate <= 0) throw new Error();
        if (date >= from && date < end) points.set(date, { date, rate });
      }
      if (!points.size) throw new Error();
      snapshot = { points: [...points.values()].sort((a, b) => a.date.localeCompare(b.date)), fetchedAt: new Date().toISOString() };
      error = null;
    } catch { error = 'Twelve Data history could not be retrieved or contained invalid daily bars.'; }
    finally { nextFetch = Date.now() + (error ? 5 * 60_000 : 6 * 60 * 60_000); }
  }
  return (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/rate-history') return next();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); res.end(JSON.stringify({ error: 'Method not allowed.' })); return; }
    if (!apiKey) { res.end(JSON.stringify({ snapshot: null, error: 'Twelve Data is not configured.' })); return; }
    void (async () => {
      if (Date.now() >= nextFetch && !pending) pending = update().finally(() => { pending = null; });
      if (pending) await pending;
      res.statusCode = error ? 503 : 200;
      res.end(JSON.stringify({ snapshot, error, source: 'Twelve Data' }));
    })();
  };
}
