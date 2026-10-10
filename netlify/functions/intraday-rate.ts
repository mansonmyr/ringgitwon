export default async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ configured: false, quote: null, error: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  try {
    const response = await fetch('https://api.twelvedata.com/exchange_rate?symbol=MYR%2FKRW', {
      headers: { Authorization: `apikey ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Invalid response.');
    }
    const body = payload as Record<string, unknown>;
    const code = Number(body.code ?? response.status);
    if (!response.ok || body.status === 'error') {
      const err = code === 401 ? 'Twelve Data rejected the API key.'
        : code === 403 || code === 404 ? 'MYR/KRW is unavailable for this Twelve Data account.'
        : code === 429 ? 'Twelve Data request limit reached.'
        : 'Twelve Data could not return a quote.';
      return new Response(JSON.stringify({ configured: true, quote: null, error: err }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.symbol !== 'MYR/KRW' || typeof body.rate !== 'number' || !Number.isFinite(body.rate) || body.rate <= 0) {
      throw new Error('Invalid quote.');
    }

    const observedAt = new Date(Number(body.timestamp) * 1000).toISOString();
    const quote = {
      rate: body.rate,
      observedAt,
      fetchedAt: new Date().toISOString(),
      source: 'Twelve Data',
      symbol: 'MYR/KRW',
    };

    return new Response(JSON.stringify({ configured: true, quote, error: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch {
    return new Response(JSON.stringify({ configured: true, quote: null, error: 'Twelve Data is unreachable.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = {
  path: '/api/intraday-rate',
};
