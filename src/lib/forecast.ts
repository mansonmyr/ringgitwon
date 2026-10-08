import type { Headline, RatePoint } from '../types';

const DAY = 86_400_000;
export const PATH_COUNT = 2000;
export const MIN_OBSERVATIONS = 60;

// Dates are calendar-day indices in Kuala Lumpur, independent of browser timezone.
export function forecastWindows(now: number) {
  const today = Math.floor((now + 8 * 3_600_000) / DAY);
  const date = new Date(today * DAY);
  const boundary = (offset: number) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1) / DAY;
  return [
    { label: 'This month', start: today, end: boundary(1) - 1 },
    { label: 'Next month', start: boundary(1), end: boundary(2) - 1 },
    { label: 'Next 3 months', start: boundary(1), end: boundary(4) - 1 },
  ];
}

// Only explicitly directional, currency-named English phrases affect the model.
// All other languages/headlines remain available as context, with zero adjustment.
export function newsSignal(articles: Headline[]) {
  const relevant = articles.filter(({ title }) => /ringgit|korean won|bank negara|bank of korea|MYR|KRW/i.test(title));
  const scored = relevant.map((article) => {
    const up = /\b(ringgit|MYR)\s+(rises|gains|strengthens)\b|\b(korean won|KRW)\s+(falls|weakens|drops)\b/i.test(article.title);
    const down = /\b(ringgit|MYR)\s+(falls|weakens|drops)\b|\b(korean won|KRW)\s+(rises|gains|strengthens)\b/i.test(article.title);
    return { article, score: Number(up) - Number(down) };
  });
  const score = scored.reduce((sum, row) => sum + row.score, 0);
  return { dailyAdjustment: Math.max(-0.00005, Math.min(0.00005, score * 0.00001)), articles: relevant.slice(0, 3), matches: scored.filter(row => row.score !== 0).length };
}

export function estimateForecast(points: RatePoint[], target: number, articles: Headline[], now = Date.now()) {
  if (!Number.isFinite(target) || target <= 0) throw new Error('Enter a target greater than zero.');
  const today = Math.floor((now + 8 * 3_600_000) / DAY);
  const history = [...new Map(points.filter(p => Number.isFinite(p.rate) && p.rate > 0 && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && Date.parse(p.date) / DAY <= today).map(p => [p.date, p])).values()].sort((a, b) => a.date.localeCompare(b.date));
  if (history.length < MIN_OBSERVATIONS) throw new Error('At least 60 historical observations are needed. Refresh history to calculate.');
  const returns = history.slice(1).map((point, i) => Math.log(point.rate / history[i].rate));
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const volatility = Math.sqrt(returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length);
  const signal = newsSignal(articles);
  const windows = forecastWindows(now);
  const latest = history[history.length - 1];
  const observedDay = Date.parse(latest.date) / DAY;
  const hits = [0, 0, 0];
  // Fixed seed gives identical paths when only the target changes.
  let seed = 17321;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let path = 0; path < PATH_COUNT; path++) {
    let rate = latest.rate;
    const touched = [observedDay === today && rate >= target, false, false];
    for (let day = observedDay + 1; day <= windows[2].end; day++) {
      const weekday = new Date(day * DAY).getUTCDay();
      if (weekday !== 0 && weekday !== 6) {
        // News influence decays across 14 calendar days rather than compounding forever.
        rate *= Math.exp(returns[Math.floor(random() * returns.length)] + signal.dailyAdjustment * Math.max(0, 1 - (day - today) / 14));
      }
      windows.forEach((window, index) => { if (day >= window.start && day <= window.end && rate >= target) touched[index] = true; });
    }
    touched.forEach((hit, index) => { if (hit) hits[index]++; });
  }
  return { windows: windows.map((window, i) => ({ ...window, percent: Math.round(100 * hits[i] / PATH_COUNT) })), mean, volatility, signal, observations: history.length, latest };
}
