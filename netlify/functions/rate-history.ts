export default async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY?.trim();
  if (!apiKey) {
    return new Response(JSON.stringify({ snapshot: null, error: 'Twelve Data is not configured.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const today = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
    const start = new Date(`${today}T00:00:00Z`);
    start.setUTCFullYear(start.getUTCFullYear() - 5);
    const end = new Date().toISOString().slice(0, 10);
    const from = start.toISOString().slice(0, 10);
    const url = new URL('https://api.twelvedata.com/time_series');
    url.search = new URLSearchParams({
      symbol: 'MYR/KRW',
      interval: '1day',
      start_date: from,
      end_date: end,
      outputsize: '5000',
      order: 'asc',
    }).toString();

    const response = await fetch(url, {
      headers: { Authorization: `apikey ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    });
    const raw: any = await response.json();
    if (!response.ok || raw.status === 'error') {
      return new Response(JSON.stringify({ snapshot: null, error: 'Twelve Data history unavailable.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const points = new Map<string, { date: string; rate: number }>();
    for (const row of raw.values ?? []) {
      const date = row?.datetime;
      const rate = Number(row?.close);
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(rate) && rate > 0) {
        if (date >= from && date < end) points.set(date, { date, rate });
      }
    }
    const snapshot = {
      points: [...points.values()].sort((a, b) => a.date.localeCompare(b.date)),
      fetchedAt: new Date().toISOString(),
    };
    return new Response(JSON.stringify({ snapshot, error: null, source: 'Twelve Data' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    return new Response(JSON.stringify({ snapshot: null, error: 'Twelve Data history could not be retrieved.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = {
  path: '/api/rate-history',
};
