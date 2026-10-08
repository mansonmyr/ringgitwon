import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RateSnapshot } from '../types';
import { fetchPeriodRates, formatFetchedTime, formatObservationDate, formatRate, readCachedPeriodRates } from '../lib/rates';
import { RateChart } from './RateChart';

type Period = { key: string; start: string; end: string; label: string };
type Props = { rates: RateSnapshot | null; rateStale: boolean; lastRefresh: string | null; onRefresh: () => void };
const HISTORY_CACHE_STALE_MS = 3 * 24 * 60 * 60 * 1000;

function isHistoryCacheStale(snapshot: RateSnapshot | null): boolean {
  const fetchedAt = snapshot ? new Date(snapshot.fetchedAt).getTime() : Number.NaN;
  return !Number.isFinite(fetchedAt) || Date.now() - fetchedAt > HISTORY_CACHE_STALE_MS;
}

function currentYearMonth(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }).formatToParts(new Date());
  return { year: Number(parts.find((part) => part.type === 'year')?.value), month: Number(parts.find((part) => part.type === 'month')?.value) };
}

function buildPeriods(): Period[] {
  const { year, month } = currentYearMonth();
  let endYear = year;
  let endMonth = month - 1;
  if (endMonth % 2 === 0) endMonth -= 1;
  while (endMonth <= 0) { endMonth += 12; endYear -= 1; }
  let startYear = endYear;
  let startMonth = endMonth - 1;
  if (startMonth <= 0) { startMonth += 12; startYear -= 1; }

  const periods: Period[] = [];
  for (let index = 0; index < 30 && startYear >= 2022; index += 1) {
    const endDate = new Date(Date.UTC(startYear, startMonth - 1 + 2, 0));
    const start = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
    const end = endDate.toISOString().slice(0, 10);
    const firstLabel = new Intl.DateTimeFormat('en-MY', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(startYear, startMonth - 1, 1))).toUpperCase();
    const lastLabel = new Intl.DateTimeFormat('en-MY', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1))).toUpperCase();
    const label = startYear === endDate.getUTCFullYear() ? `${firstLabel}–${lastLabel} ${endDate.getUTCFullYear()}` : `${firstLabel} ${startYear}–${lastLabel} ${endDate.getUTCFullYear()}`;
    periods.push({ key: `${startYear}-${String(startMonth).padStart(2, '0')}`, start, end, label });
    startMonth -= 2;
    if (startMonth <= 0) { startMonth += 12; startYear -= 1; }
  }
  return periods;
}

export function RateSurveillance({ rates, rateStale, lastRefresh, onRefresh }: Props) {
  const periods = useMemo(buildPeriods, []);
  const [view, setView] = useState<'14days' | 'bimonthly'>('14days');
  const [periodKey, setPeriodKey] = useState(periods[0]?.key ?? '');
  const selectedPeriod = periods.find((period) => period.key === periodKey) ?? periods[0];
  const [history, setHistory] = useState(() => selectedPeriod ? readCachedPeriodRates(selectedPeriod.key) : null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const loadSequence = useRef(0);

  const loadHistory = useCallback(async (force: boolean) => {
    if (!selectedPeriod) return;
    const sequence = ++loadSequence.current;
    const cached = readCachedPeriodRates(selectedPeriod.key);
    if (cached) setHistory(cached);
    else setHistory(null);
    if (!force && cached && !isHistoryCacheStale(cached)) {
      setHistoryError(null);
      setLoadingHistory(false);
      return;
    }
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const result = await fetchPeriodRates(selectedPeriod.key, selectedPeriod.start, selectedPeriod.end);
      if (sequence === loadSequence.current) setHistory(result);
    } catch (reason) {
      if (sequence === loadSequence.current) setHistoryError(reason instanceof Error ? reason.message : 'This period could not be refreshed.');
    } finally {
      if (sequence === loadSequence.current) setLoadingHistory(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (view === 'bimonthly') void loadHistory(false);
  }, [loadHistory, view]);

  const displayed = view === '14days' ? rates?.points ?? [] : history?.points ?? [];
  const historyStale = view === 'bimonthly' && (historyError !== null || (history ? isHistoryCacheStale(history) : !loadingHistory));
  const displayedLatest = displayed.at(-1);
  const checked = view === '14days' ? lastRefresh : history?.fetchedAt ?? null;

  return <>
    <div className="surveillance-tabs" role="tablist" aria-label="Rate history period">
      <button type="button" role="tab" aria-selected={view === '14days'} className={view === '14days' ? 'is-selected' : ''} onClick={() => setView('14days')}>14 DAYS</button>
      <button type="button" role="tab" aria-selected={view === 'bimonthly'} className={view === 'bimonthly' ? 'is-selected' : ''} onClick={() => setView('bimonthly')}>BI-MONTHLY</button>
      {view === 'bimonthly' && selectedPeriod && <label className="period-select">HISTORY PERIOD
        <select value={periodKey} onChange={(event) => setPeriodKey(event.target.value)} aria-label="Choose a completed two-month period">
          {periods.map((period) => <option key={period.key} value={period.key}>{period.label}</option>)}
        </select>
      </label>}
      <button className="history-refresh" type="button" onClick={() => view === '14days' ? onRefresh() : void loadHistory(true)} disabled={view === 'bimonthly' && loadingHistory}>{loadingHistory ? 'LOADING…' : '↻ REFRESH'}</button>
    </div>
    <div className="market-summary">
      <div><span className="micro-label">{view === '14days' ? 'LATEST OBSERVATION' : 'LATEST IN PERIOD'}</span><strong>{displayedLatest ? formatRate(displayedLatest.rate) : '—'} <small>KRW / RM1</small></strong><span className="summary-date">{displayedLatest ? `Published ${formatObservationDate(displayedLatest.date)}` : 'Rate unavailable'}</span></div>
      <div className="summary-side"><span className="micro-label">{historyStale || rateStale && view === '14days' ? 'SOURCE STATUS' : 'DATA CHECKED'}</span><strong className={historyStale || rateStale && view === '14days' ? 'amber-text' : 'mint-text'}>{historyStale || rateStale && view === '14days' ? 'UNAVAILABLE' : checked ? formatFetchedTime(checked) : 'CHECKING…'}</strong><span className="summary-date">Asia/Kuala_Lumpur</span></div>
    </div>
    {view === 'bimonthly' && historyError && <p className="inline-stale">{history ? `Refresh failed. Showing saved observations through ${formatObservationDate(history.points.at(-1)!.date)}.` : historyError}</p>}
    {view === '14days' && rateStale && rates && <p className="inline-stale">Rate feed is unavailable. Last-known observations are shown.</p>}
    {view === 'bimonthly' && loadingHistory && !history && <p className="inline-stale">Loading daily observations for {selectedPeriod?.label}…</p>}
    <RateChart points={displayed} windowLabel={view === '14days' ? 'Two-week' : selectedPeriod?.label ?? 'Period'} scrollable={view === 'bimonthly'} />
    {view === 'bimonthly' && historyStale && <p className="chart-caption">This period’s source data is unavailable or older than three days. Check again before using it for travel plans.</p>}
  </>;
}
