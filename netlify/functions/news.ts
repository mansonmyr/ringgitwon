const feeds = [
  { id: 'korea-economy', name: 'The Korea Times · Economy', category: 'korea', url: 'https://feed.koreatimes.co.kr/k/economy.xml' },
  { id: 'korea-business', name: 'The Korea Times · Business', category: 'korea', url: 'https://feed.koreatimes.co.kr/k/business.xml' },
  { id: 'korea', name: 'The Korea Times · South Korea', category: 'korea', url: 'https://feed.koreatimes.co.kr/k/southkorea.xml' },
  { id: 'malaysia', name: 'Malay Mail · Malaysia', category: 'local', url: 'https://www.malaymail.com/feed/rss/malaysia' },
  { id: 'business', name: 'CNA · Business', category: 'international', url: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6936' },
  { id: 'world', name: 'CNA · World', category: 'international', url: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311' },
] as const;

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = await Promise.all(
    feeds.map(async (feed) => {
      try {
        const response = await fetch(feed.url, {
          signal: AbortSignal.timeout(12_000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WonDaWon/1.0)',
            Accept: 'application/rss+xml, application/xml, text/xml',
          },
        });
        if (!response.ok) throw new Error('Feed unavailable');
        const xml = await response.text();
        if (
          xml.length > 2_000_000 ||
          !/<rss[\s>]/i.test(xml) ||
          !/<channel[\s>]/i.test(xml) ||
          /<!DOCTYPE|<!ENTITY/i.test(xml)
        ) {
          throw new Error('Invalid RSS');
        }
        return {
          id: feed.id,
          name: feed.name,
          category: feed.category,
          xml,
          fetchedAt: new Date().toISOString(),
        };
      } catch {
        return {
          id: feed.id,
          name: feed.name,
          category: feed.category,
          error: `${feed.name} could not be refreshed.`,
        };
      }
    })
  );

  return new Response(JSON.stringify({ feeds: results }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=1800',
    },
  });
};

export const config = {
  path: '/api/news',
};
