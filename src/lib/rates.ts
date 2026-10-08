import type { RatePoint, RateSnapshot } from '../types';

const CACHE_KEY = 'ringgit-heist-rate-cache-v1';
const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

type ProviderRow = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function fromCache(): RateSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RateSnapshot;
    if (!Array.isArray(parsed.points) || parsed.points.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(snapshot: RateSnapshot): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // The dashboard still works when browser storage is unavailable.
  }
}

export function isRateStale(snapshot: RateSnapshot | null, now = Date.now()): boolean {
  const latest = snapshot?.points.at(-1);
  if (!latest) return true;
  const observedAt = new Date(`${latest.date}T00:00:00Z`).getTime();
  return !Number.isFinite(observedAt) || now - observedAt > STALE_AFTER_MS;
}

export function readCachedRates(): RateSnapshot | null {
  return fromCache();
}

export async function fetchRates(): Promise<RateSnapshot> {
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 13);
  const snapshot = await fetchRateRange(isoDate(start), isoDate(today));
  saveCache(snapshot);
  return snapshot;
}

export function readCachedPeriodRates(key: string): RateSnapshot | null {
  try {
    const raw = localStorage.getItem(`ringgit-heist-rate-period-v1:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RateSnapshot;
    return Array.isArray(parsed.points) && parsed.points.length ? parsed : null;
  } catch {
    return null;
  }
}

export async function fetchPeriodRates(key: string, start: string, end: string): Promise<RateSnapshot> {
  const snapshot = await fetchRateRange(start, end);
  try { localStorage.setItem(`ringgit-heist-rate-period-v1:${key}`, JSON.stringify(snapshot)); } catch { /* Period history still works without browser storage. */ }
  return snapshot;
}

async function fetchRateRange(start: string, end: string): Promise<RateSnapshot> {
  const url = new URL('https://api.frankfurter.dev/v2/rates');
  url.searchParams.set('base', 'EUR');
  url.searchParams.set('quotes', 'MYR,KRW');
  url.searchParams.set('from', start);
  url.searchParams.set('to', end);

  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`Rate service returned ${response.status}`);
  const rows = (await response.json()) as ProviderRow[];
  const byDate = new Map<string, Partial<Record<'MYR' | 'KRW', number>>>();

  for (const row of rows) {
    if ((row.quote !== 'MYR' && row.quote !== 'KRW') || !Number.isFinite(row.rate) || row.rate <= 0) continue;
    const current = byDate.get(row.date) ?? {};
    current[row.quote] = row.rate;
    byDate.set(row.date, current);
  }

  const points: RatePoint[] = [...byDate.entries()]
    .flatMap(([date, quotes]) => {
      const myr = quotes.MYR;
      const krw = quotes.KRW;
      if (!myr || !krw) return [];
      return [{ date, rate: krw / myr }];
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (points.length === 0) {
    throw new Error('The rate provider did not return matching MYR and KRW observations.');
  }

  return { points, fetchedAt: new Date().toISOString() };
}

export function formatRate(rate: number): string {
  return new Intl.NumberFormat('en-MY', { maximumFractionDigits: 3, minimumFractionDigits: 2 }).format(rate);
}

export function formatObservationDate(date: string): string {
  const value = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(value);
}

export function formatFetchedTime(date: string): string {
  return new Intl.DateTimeFormat('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(date));
}
