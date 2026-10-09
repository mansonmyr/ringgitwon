import { useEffect, useState } from 'react';
import type { NewsSnapshot } from '../types';
import { formatNewsDate, isNewsStale, selectNews, readCachedNews, NEWS_DAYS, NEWS_PER_SECTION } from '../lib/news';

type Props = { snapshot: NewsSnapshot | null; stale: boolean; error: string | null; onRefresh: () => void };

export function NewsBanner({ snapshot, stale, error, onRefresh }: Props) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => { setNow(Date.now()); readCachedNews(); }, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const articles = selectNews(snapshot?.articles ?? [], now);
  const outdated = stale || isNewsStale(snapshot, now);
  return <section className="news-panel" aria-label="Malaysian, South Korean and international news">
    <div className="news-heading">
      <div><span className="section-kicker">WIRE TAP / MALAYSIA / KOREA / WORLD · LAST {NEWS_DAYS} DAYS</span><h2>Headlines in the signal</h2></div>
      <span className={`freshness ${outdated ? 'is-stale' : ''}`}><i />{outdated ? 'FEED UPDATE NEEDED' : 'FEEDS CONNECTED'}</span>
    </div>
    <p className="forecast-caption">Today, yesterday and the day before (MYT) · up to {NEWS_PER_SECTION} headlines per section, newest first · at most 90 saved headlines. Some feeds may supply fewer than 30. Reloads reuse fresh feeds for up to 30 minutes.</p>
    {snapshot?.feeds?.map(feed => <p className="chart-caption" key={feed.id}>{feed.name} · {feed.fetchedAt ? `Last updated ${formatNewsDate(feed.fetchedAt)} MYT` : 'No successful update yet'}{feed.error ? ' · Refresh unavailable; saved reports shown when available.' : ''}</p>)}
    {error && <p className="stale-note" role="status">{error}</p>}
    {(['local', 'korea', 'international'] as const).map(category => {
      const selected = articles.filter(article => article.category === category);
      return <div key={category} className="news-desk">
        <h3>{category === 'local' ? 'Malaysia · Local news' : category === 'korea' ? 'South Korea · News in English' : 'International · Business, war, trade fairs & aviation'} <small>({selected.length})</small></h3>
        {selected.length ? <div className="headline-grid" role="list" aria-label={`${category} headlines`}>
          {selected.map((article, index) => <a className="headline" role="listitem" key={article.url} href={article.url} target="_blank" rel="noopener noreferrer">
            <span className="headline-index">{String(index + 1).padStart(2, '0')} / OPEN REPORT ↗</span>
            <strong>{article.title}</strong>
            <span className="headline-meta">{article.source} · {formatNewsDate(article.publishedAt)} MYT</span>
          </a>)}
        </div> : <p className="news-empty">No matching reports for these {NEWS_DAYS} calendar days are available for this section.</p>}
      </div>;
    })}
    <button className="news-inline-retry" type="button" onClick={onRefresh}>REFRESH HEADLINES</button>
  </section>;
}
