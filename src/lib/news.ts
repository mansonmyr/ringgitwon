import type { Headline, NewsSnapshot } from '../types';

const CACHE_KEY = 'ringgitwon-publisher-news-v1';
const FRESH_CACHE_MS = 30 * 60_000;
let pending: Promise<NewsSnapshot> | null = null;
export const NEWS_DAYS = 3;
export const NEWS_PER_SECTION = 30;
// Business feed is already categorized by the publisher. World feed headlines
// must explicitly match one of the requested subjects; no full articles stored.
const INTERNATIONAL_TOPICS = /\b(business|econom(?:y|ic|ies)|companies|company|corporat\w*|bank(?:s|ing)?|stocks?|shares?|invest\w*|financial|finance|inflation|tariffs?|exports?|imports?|trade|markets?|earnings|profits?|mergers?|acquisition|war|wars|warfare|military|armed conflict|invasion|troops|missiles?|airstrikes?|ceasefire|trade[ -]?fairs?|trade[ -]?shows?|expo|expos|aviation|airlines?|airports?|aircraft|airplanes?|aeroplanes?|flights?|airspace|airbus|boeing)\b/i;

export function selectNews(articles: Headline[], now = Date.now()): Headline[] {
  const counts = { local: 0, korea: 0, international: 0 };
  // Today plus the two preceding calendar days in Kuala Lumpur (UTC+8).
  const offset = 8 * 3_600_000;
  const cutoff = Math.floor((now + offset) / 86_400_000) * 86_400_000 - offset - (NEWS_DAYS - 1) * 86_400_000;
  return [...new Map(articles.map(article => [article.url, article])).values()]
    .filter(article => {
      const published = Date.parse(article.publishedAt);
      return published >= cutoff && published <= now && typeof article.title === 'string'
        && (article.category !== 'international' || article.feedId === 'business' || INTERNATIONAL_TOPICS.test(article.title));
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .filter(article => {
      const category = article.category;
      return category && Object.hasOwn(counts, category) && counts[category]++ < NEWS_PER_SECTION;
    });
}

function saveCache(snapshot: NewsSnapshot): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
    // Retire only this app's obsolete GDELT caches.
    for (const version of [1, 2, 3]) localStorage.removeItem(`ringgit-heist-news-cache-v${version}`);
  } catch { /* Headlines still work when browser storage is unavailable. */ }
}

export function readCachedNews(): NewsSnapshot | null {
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as NewsSnapshot | null;
    if (!value || !Array.isArray(value.articles) || !Array.isArray(value.feeds)) return null;
    const trimmed = { ...value, articles: selectNews(value.articles) };
    saveCache(trimmed);
    return trimmed;
  } catch { return null; }
}

export function isNewsStale(snapshot: NewsSnapshot | null, now = Date.now()): boolean {
  if (!snapshot) return true;
  const age = now - Date.parse(snapshot.fetchedAt);
  return !Number.isFinite(age) || age < 0 || age > 24 * 3_600_000 || Boolean(snapshot.feeds?.some(feed => feed.error));
}

type Feed = { id: string; name: string; category: 'local' | 'international' | 'korea'; xml?: string; fetchedAt?: string; error?: string };
function parseFeed(feed: Feed): Headline[] {
  if (!feed.xml || /<!DOCTYPE|<!ENTITY/i.test(feed.xml)) throw new Error('Unreadable feed');
  const document = new DOMParser().parseFromString(feed.xml, 'application/xml');
  if (document.querySelector('parsererror') || !document.querySelector('rss > channel')) throw new Error('Unreadable feed');
  const items = [...document.querySelectorAll('channel > item')];
  const now = new Date();
  const articles = items.flatMap(item => {
    const title = item.querySelector('title')?.textContent?.trim();
    const link = item.querySelector('link')?.textContent?.trim();
    const date = new Date(item.querySelector('pubDate')?.textContent ?? '');
    if (!title || !link || !Number.isFinite(date.getTime()) || date > now) return [];
    let url: URL;
    try { url = new URL(link); } catch { return []; }
    if (!['https:', 'http:'].includes(url.protocol)) return [];
    return [{ title, url: url.href, source: feed.name, publishedAt: date.toISOString(), category: feed.category, feedId: feed.id }];
  });
  if (items.length && !articles.length) throw new Error('No readable articles');
  return articles;
}

export function fetchNews(force = false): Promise<NewsSnapshot> {
  if (pending) return pending;
  const cached = readCachedNews();
  if (!force && cached && cached.feeds?.some(feed => feed.id === 'korea-economy') && !isNewsStale(cached) && Date.now() - Date.parse(cached.fetchedAt) < FRESH_CACHE_MS) return Promise.resolve(cached);
  pending = refresh(cached).finally(() => { pending = null; });
  return pending;
}

async function refresh(cached: NewsSnapshot | null): Promise<NewsSnapshot> {
  const response = await fetch('/api/news', { signal: AbortSignal.timeout(18_000) });
  if (!response.ok) throw new Error('Publisher feeds could not be reached. Saved headlines remain available.');
  const body = await response.json() as { feeds: Feed[] };
  if (!Array.isArray(body.feeds) || !body.feeds.length) throw new Error('News returned an unreadable response.');
  const articles: Headline[] = [];
  const statuses: NonNullable<NewsSnapshot['feeds']> = [];
  for (const feed of body.feeds) {
    let current: Headline[] = [];
    let error = feed.error;
    let fetchedAt = feed.fetchedAt;
    try { current = parseFeed(feed); }
    catch { error = `${feed.name} could not be refreshed.`; fetchedAt = cached?.feeds?.find(item => item.id === feed.id)?.fetchedAt; }
    // Merge saved reports before enforcing the rolling period and per-section cap.
    articles.push(...(cached?.articles.filter(article => article.feedId === feed.id) ?? []), ...current);
    statuses.push({ id: feed.id, name: feed.name, fetchedAt, error });
  }
  if (statuses.every(feed => feed.error) && !articles.length) throw new Error('Publisher feeds are temporarily unavailable. Try again shortly.');
  const selected = selectNews(articles);
  const times = statuses.map(feed => Date.parse(feed.fetchedAt ?? '')).filter(Number.isFinite);
  const snapshot: NewsSnapshot = { articles: selected, fetchedAt: new Date(times.length ? Math.max(...times) : 0).toISOString(), feeds: statuses };
  saveCache(snapshot);
  return snapshot;
}

export function formatNewsDate(value: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return 'Not yet updated';
  return new Intl.DateTimeFormat('en-MY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }).format(parsed);
}
