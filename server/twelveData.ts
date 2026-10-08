import type { Connect } from 'vite';

const INTERVAL = 5 * 60_000;
type Quote = { rate: number; observedAt: string; fetchedAt: string; source: 'Twelve Data'; symbol: 'MYR/KRW' };

// Fixed pair and shared cache: clients cannot spend credits on arbitrary queries.
export function twelveDataMiddleware(apiKey: string): Connect.NextHandleFunction {
  let quote: Quote | null = null;
  let nextFetch = 0;
  let pending: Promise<void> | null = null;
  let error: string | null = null;
  async function updateQuote() {
    try {
      const response = await fetch('https://api.twelvedata.com/exchange_rate?symbol=MYR%2FKRW', {
        headers: { Authorization: `apikey ${apiKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid response.');
      const body = payload as Record<string, unknown>;
      const code = Number(body.code ?? response.status);
      if (!response.ok || body.status === 'error') {
        error = code === 401 ? 'Twelve Data rejected the API key.'
          : code === 403 || code === 404 ? 'MYR/KRW is unavailable for this Twelve Data account. Check pair coverage and plan access.'
          : code === 429 ? 'Twelve Data request limit reached. Retrying after the cache interval.'
          : 'Twelve Data could not return a quote. Check account access and try again later.';
        return;
      }
      if (body.symbol !== 'MYR/KRW' || typeof body.rate !== 'number' || !Number.isFinite(body.rate) || body.rate <= 0
        || typeof body.timestamp !== 'number' || !Number.isSafeInteger(body.timestamp) || body.timestamp <= 0 || body.timestamp * 1000 > Date.now() + 120_000) {
        error = 'Twelve Data returned an invalid quote or timestamp.';
        return;
      }
      const observedAt = new Date(body.timestamp * 1000).toISOString();
      if (quote && observedAt < quote.observedAt) {
        error = 'Twelve Data returned an older quote. Keeping the last known value.';
        return;
      }
      quote = { rate: body.rate, observedAt, fetchedAt: new Date().toISOString(), source: 'Twelve Data', symbol: 'MYR/KRW' };
      error = null;
    } catch {
      // Never forward upstream errors/URLs/headers that could contain credentials.
      error = 'Twelve Data is unreachable or returned an unreadable response.';
    } finally { nextFetch = Date.now() + INTERVAL; }
  }
  return (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/intraday-rate') return next();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); res.end(JSON.stringify({ error: 'Method not allowed.' })); return; }
    if (!apiKey) { res.end(JSON.stringify({ configured: false, quote: null, error: null })); return; }
    void (async () => {
      if (Date.now() >= nextFetch && !pending) pending = updateQuote().finally(() => { pending = null; });
      if (pending) await pending;
      res.statusCode = error ? 503 : 200;
      res.end(JSON.stringify({ configured: true, quote, error }));
    })();
  };
}
