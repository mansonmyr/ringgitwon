import type { NewsSnapshot } from '../types';
import { formatNewsDate, isNewsStale } from '../lib/news';

type Props = { snapshot: NewsSnapshot | null; stale: boolean; error: string | null; onRefresh: () => void };

function currentMonthKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }).formatToParts(now);
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`;
}

function articleMonthKey(publishedAt: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }).formatToParts(new Date(publishedAt));
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-MY', { month: 'long', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' }).format(date);
}

export function NewsBanner({ snapshot, stale, error, onRefresh }: Props) {
  const monthKey = currentMonthKey();
  const currentLabel = monthLabel(new Date());
  const selectedLabel = currentLabel;
  const articles = snapshot?.articles.filter((article) => articleMonthKey(article.publishedAt) === monthKey) ?? [];
  const monthUnavailable = snapshot?.unavailableMonths?.includes(monthKey) ?? false;
  const monthStale = stale || monthUnavailable || (snapshot ? isNewsStale(snapshot) : true);
  const readableError = error && /rate.?limit|429/i.test(error)
    ? 'GDELT is temporarily rate-limiting requests. Saved headlines will remain visible when available; try again later.'
    : error && /failed to fetch|networkerror|load failed/i.test(error)
      ? 'This browser could not reach GDELT. Check the connection or try again later.'
      : error && /unreadable response/i.test(error)
        ? 'GDELT returned an unreadable response. Saved headlines will remain visible when available; try again later.'
        : error;

  return (
    <section className="news-panel" aria-label="International finance news">
      <div className="news-heading">
        <div><span className="section-kicker">WIRE TAP / GLOBAL DESK · {selectedLabel.toUpperCase()}</span><h2>Headlines in the signal</h2></div>
        <span className={`freshness ${monthStale ? 'is-stale' : ''}`}><i />{monthStale ? 'STALE / CHECK' : 'FEED CONNECTED'}</span>
      </div>
      <div className="news-month-status">{currentLabel.toUpperCase()} · {articles.length} HEADLINES · THIS MONTH</div>
      {articles.length ? <div className="headline-grid" role="list" aria-label={`${articles.length} headlines for ${selectedLabel}`}>
        {articles.map((article, index) => (
          <a className="headline" key={`${article.url}-${index}`} href={article.url} target="_blank" rel="noreferrer">
            <span className="headline-index">{String(index + 1).padStart(2, '0')} / OPEN REPORT ↗</span>
            <strong>{article.title}</strong>
            <span className="headline-meta">{article.source} · {formatNewsDate(article.publishedAt)}</span>
          </a>
        ))}
      </div> : <div className="news-empty" role="status">
        {readableError || (monthUnavailable ? `${selectedLabel} headlines could not be refreshed.` : snapshot ? `No ${selectedLabel} headlines were returned.` : `${selectedLabel} headlines are unavailable.`)}
        <button className="news-retry" type="button" onClick={onRefresh}>REFRESH {selectedLabel.toUpperCase()}</button>
      </div>}
      {monthStale && articles.length > 0 && <p className="stale-note">Showing saved {selectedLabel} headlines. Their source dates are shown on each report. <button className="news-inline-retry" type="button" onClick={onRefresh}>TRY AGAIN</button></p>}
    </section>
  );
}
