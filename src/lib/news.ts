import type { Headline, NewsSnapshot } from '../types';

const CACHE_KEY = 'ringgit-heist-news-cache-v3';
const LEGACY_CACHE_KEYS = ['ringgit-heist-news-cache-v2', 'ringgit-heist-news-cache-v1'];
const NEWS_QUERY = '(forex OR "foreign exchange" OR currency OR currencies OR "exchange rate" OR "central bank" OR "interest rate" OR inflation OR tariff OR trade OR "monetary policy" OR sanctions OR conflict OR war OR ringgit OR MYR OR "Korean won" OR KRW OR "Bank Negara" OR "Bank of Korea")';
const PROVIDER_COOLDOWN_MS = 10_000;
const LAST_REQUEST_KEY = 'ringgit-heist-news-last-request-v1';
const FRESH_CACHE_MS = 30 * 60 * 1000;

let newsRequestInFlight: Promise<NewsSnapshot> | null = null;
let lastNewsRequestAt = 0;
let providerQueue: Promise<void> = Promise.resolve();

type GdeltArticle = {
  title?: string;
  url?: string;
  domain?: string;
  seendate?: string;
  language?: string;
};


function monthKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }).formatToParts(date);
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`;
}

function monthWindow(now: Date): { start: string; end: string } {
  const [year, month] = monthKey(now).split('-').map(Number);
  const monthStartUtc = Date.UTC(year, month - 1, 1);
  const kualaLumpurOffset = 8 * 60 * 60 * 1000;
  const format = (value: number) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');
  return {
    start: format(monthStartUtc - kualaLumpurOffset),
    end: format(now.getTime()),
  };
}

function readCache(): NewsSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY) ?? LEGACY_CACHE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NewsSnapshot;
    return Array.isArray(parsed.articles) ? parsed : null;
  } catch {
    return null;
  }
}

export function readCachedNews(): NewsSnapshot | null {
  return readCache();
}

function normalizeGdeltDate(value?: string): string {
  if (!value) return '';
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}T${compact[4]}:${compact[5]}:${compact[6]}Z`;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

export function isNewsStale(snapshot: NewsSnapshot | null, now = Date.now()): boolean {
  if (!snapshot) return true;
  const fetchedAt = new Date(snapshot.fetchedAt).getTime();
  return !Number.isFinite(fetchedAt) || fetchedAt > now || now - fetchedAt > 24 * 60 * 60 * 1000;
}

export function fetchNews(force = false): Promise<NewsSnapshot> {
  if (newsRequestInFlight) return newsRequestInFlight;
  const cached = readCache();
  const cachedAt = cached ? new Date(cached.fetchedAt).getTime() : Number.NaN;
  const cacheIsFresh = cachedAt <= Date.now() && Date.now() - cachedAt < FRESH_CACHE_MS;
  if (cached && cached.articles.length > 0 && !cached.unavailableMonths?.length && cacheIsFresh && !force) {
    return Promise.resolve(cached);
  }
  newsRequestInFlight = fetchFreshNews().finally(() => { newsRequestInFlight = null; });
  return newsRequestInFlight;
}

async function fetchFreshNews(): Promise<NewsSnapshot> {
  const now = new Date();
  const currentKey = monthKey(now);
  const window = monthWindow(now);
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.searchParams.set('query', NEWS_QUERY);
  url.searchParams.set('mode', 'artlist');
  url.searchParams.set('format', 'json');
  url.searchParams.set('startdatetime', window.start);
  url.searchParams.set('enddatetime', window.end);
  url.searchParams.set('maxrecords', '250');
  url.searchParams.set('sort', 'datedesc');
  const body = await fetchGdelt(url);
  const articles = body.articles.flatMap((article) => {
    const headline = normalizeArticle(article, now);
    if (!headline) return [];
    const publishedTime = new Date(headline.publishedAt).getTime();
    return publishedTime <= now.getTime() && monthKey(new Date(headline.publishedAt)) === currentKey ? [headline] : [];
  });
  const snapshot: NewsSnapshot = { articles, fetchedAt: new Date().toISOString(), unavailableMonths: [] };
  writeCache(CACHE_KEY, snapshot);
  return snapshot;
}

async function fetchGdelt(url: URL): Promise<{ articles: GdeltArticle[] }> {
  return serializeProviderRequest(async () => {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    if (response.status === 429 || response.status === 503) throw new Error('News service is briefly rate-limiting requests. Wait a few seconds, then refresh.');
    throw new Error(`News service returned ${response.status}`);
  }
  const raw = await response.text();
    let body: { articles?: GdeltArticle[] };
  try {
    body = JSON.parse(raw) as { articles?: GdeltArticle[] };
  } catch {
    if (/limit.{0,24}request|one every 5 seconds|high-traffic|rate.?limit/i.test(raw)) {
      throw new Error('News service is briefly rate-limiting requests. Wait a few seconds, then refresh.');
    }
    throw new Error('News service returned an unreadable response. Cached headlines are shown; try refreshing again in a few seconds.');
  }
    if (!Array.isArray(body.articles)) throw new Error('News service returned an unexpected response.');
    return { articles: body.articles };
  });
}

async function serializeProviderRequest<T>(operation: () => Promise<T>): Promise<T> {
  const previous = providerQueue;
  let release = () => {};
  providerQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  const persistedAt = (() => {
    try { return Number(localStorage.getItem(LAST_REQUEST_KEY)) || 0; }
    catch { return 0; }
  })();
  const lastRequest = Math.max(lastNewsRequestAt, persistedAt);
  const waitMs = PROVIDER_COOLDOWN_MS - (Date.now() - lastRequest);
  if (waitMs > 0) await new Promise((resolve) => window.setTimeout(resolve, waitMs));
  lastNewsRequestAt = Date.now();
  try { localStorage.setItem(LAST_REQUEST_KEY, String(lastNewsRequestAt)); } catch { /* In-memory spacing still applies. */ }
  try {
    return await operation();
  } finally {
    release();
  }
}

function normalizeArticle(article: GdeltArticle, now: Date): Headline | null {
  if (!article.title || !article.url) return null;
  let urlValue: URL;
  try {
    urlValue = new URL(article.url);
  } catch {
    return null;
  }
  if (urlValue.protocol !== 'https:' && urlValue.protocol !== 'http:') return null;
  const publishedAt = normalizeGdeltDate(article.seendate);
  if (!publishedAt || new Date(publishedAt).getTime() > now.getTime()) return null;
  return { title: article.title, url: urlValue.toString(), source: article.domain || urlValue.hostname, publishedAt, language: article.language };
}

function writeCache(key: string, snapshot: NewsSnapshot): void {
  try {
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // News lists still work when browser storage is unavailable.
  }
}

export function formatNewsDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Date not supplied';
  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur',
  }).format(parsed);
}
