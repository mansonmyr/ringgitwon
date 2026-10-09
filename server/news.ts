import type { Connect } from 'vite';

// Fixed publisher feeds only: this endpoint is not an arbitrary URL proxy.
const feeds = [
  { id: 'korea-economy', name: 'The Korea Times · Economy', category: 'korea', url: 'https://feed.koreatimes.co.kr/k/economy.xml' },
  { id: 'korea-business', name: 'The Korea Times · Business', category: 'korea', url: 'https://feed.koreatimes.co.kr/k/business.xml' },
  { id: 'korea', name: 'The Korea Times · South Korea', category: 'korea', url: 'https://feed.koreatimes.co.kr/k/southkorea.xml' },
  { id: 'malaysia', name: 'Malay Mail · Malaysia', category: 'local', url: 'https://www.malaymail.com/feed/rss/malaysia' },
  { id: 'business', name: 'CNA · Business', category: 'international', url: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6936' },
  { id: 'world', name: 'CNA · World', category: 'international', url: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311' },
] as const;
const INTERVAL = 30 * 60_000;
type FeedState = { xml?: string; fetchedAt?: string; error?: string; nextFetch: number };
export function newsMiddleware(): Connect.NextHandleFunction {
  const cache = new Map<string, FeedState>();
  let pending: Promise<void> | null = null;
  async function refresh() {
    await Promise.all(feeds.map(async feed => {
      const previous = cache.get(feed.id);
      if (previous && previous.nextFetch > Date.now()) return;
      try {
        const response = await fetch(feed.url, { signal: AbortSignal.timeout(12_000), headers: { Accept: 'application/rss+xml, application/xml, text/xml' } });
        if (!response.ok) throw new Error('Feed unavailable');
        const xml = await response.text();
        if (xml.length > 2_000_000 || !/<rss[\s>]/i.test(xml) || !/<channel[\s>]/i.test(xml) || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Invalid RSS');
        cache.set(feed.id, { xml, fetchedAt: new Date().toISOString(), nextFetch: Date.now() + INTERVAL });
      } catch {
        cache.set(feed.id, { ...previous, error: `${feed.name} could not be refreshed.`, nextFetch: Date.now() + 60_000 });
      }
    }));
  }
  return (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/news') return next();
    if (req.method !== 'GET') { res.statusCode = 405; res.end(); return; }
    pending ??= refresh().finally(() => { pending = null; });
    void pending.then(() => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ feeds: feeds.map(feed => ({ id: feed.id, name: feed.name, category: feed.category, ...cache.get(feed.id), nextFetch: undefined })) }));
    }).catch(() => { res.statusCode = 503; res.end(JSON.stringify({ error: 'News temporarily unavailable.' })); });
  };
}
