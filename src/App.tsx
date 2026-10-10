import { useCallback, useEffect, useState } from 'react';
import { NewsBanner } from './components/NewsBanner';
import { RateSurveillance } from './components/RateSurveillance';
import { SignalRoom } from './components/SignalRoom';
import { ForecastCards } from './components/ForecastCards';
import { INTRADAY_STALE_MS, quoteTime, useIntradayRate } from './lib/intraday';
import { fetchNews, isNewsStale, readCachedNews } from './lib/news';
import { fetchRates, formatObservationDate, formatRate, isRateStale, readCachedRates } from './lib/rates';
import type { NewsSnapshot, RateSnapshot } from './types';

const REFRESH_MS = 60 * 60 * 1000;
const THEME_KEY = 'ringgit-heist-theme-v1';
type Theme = 'dark' | 'light';

function FloatingNote({ className, src }: { className: string; src: string }) {
  return <div className={`currency-note ${className}`} aria-hidden="true"><img src={src} alt="" /></div>;
}

export default function App() {
  const intraday = useIntradayRate();
  const [rates, setRates] = useState<RateSnapshot | null>(() => readCachedRates());
  const [news, setNews] = useState<NewsSnapshot | null>(() => readCachedNews());
  const [rateError, setRateError] = useState<string | null>(null);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rateVerified, setRateVerified] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    try { return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* Theme still works for this visit. */ }
  }, [theme]);

  const refresh = useCallback(async (forceNews = false) => {
    setRefreshing(true);
    const [rateResult, newsResult] = await Promise.allSettled([fetchRates(), fetchNews(forceNews)]);
    if (rateResult.status === 'fulfilled') { setRates(rateResult.value); setRateError(null); setRateVerified(true); }
    else { setRateVerified(false); setRateError(rateResult.reason instanceof Error ? rateResult.reason.message : 'Rate data could not be refreshed.'); }
    if (newsResult.status === 'fulfilled') { setNews(newsResult.value); setNewsError(null); }
    else setNewsError(newsResult.reason instanceof Error ? newsResult.reason.message : 'News could not be refreshed.');
    setLastRefresh(new Date().toISOString());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const latest = rates?.points.at(-1);
  const rateStale = isRateStale(rates);
  const newsStale = isNewsStale(news) || Boolean(news?.unavailableMonths?.length);
  const combinedStale = rateStale || newsStale || !rateVerified || Boolean(rateError || newsError);
  const rateStatus = refreshing ? 'CHECKING' : !rates ? 'UNAVAILABLE' : rateStale ? 'OUT OF DATE' : !rateVerified ? 'SAVED DATA' : 'DAILY REFERENCE';
  const useIntraday = intraday.configured === true;
  const displayedRate = useIntraday ? intraday.quote?.rate : latest?.rate;
  const displayedStatus = useIntraday
    ? intraday.loading ? 'CHECKING' : intraday.error ? 'UNAVAILABLE' : !intraday.quote ? 'WAITING' : intraday.fresh ? 'RECENT QUOTE' : 'OUT OF DATE'
    : rateStatus;
  const previousQuote = intraday.previous;
  const quoteGap = intraday.quote && previousQuote ? Date.parse(intraday.quote.observedAt) - Date.parse(previousQuote.observedAt) : Infinity;
  const roomRate = useIntraday
    ? intraday.quote ? { rate: intraday.quote.rate, date: intraday.quote.observedAt, previousRate: quoteGap <= INTRADAY_STALE_MS ? previousQuote?.rate : undefined, fresh: intraday.fresh, source: 'Twelve Data', timeLabel: `${quoteTime(intraday.quote.observedAt)} MYT` } : null
    : intraday.configured === false && latest ? { ...latest, previousRate: rates?.points.at(-2)?.rate, fresh: rateVerified && !rateStale, source: 'Frankfurter · daily reference', timeLabel: formatObservationDate(latest.date) } : null;

  return (
    <>
      <div className="currency-backdrop" aria-hidden="true">
        <FloatingNote className="note-a" src="/ringgit-rm50.jpg" />
        <FloatingNote className="note-b" src="/korean-won-50000.jpg" />
        <FloatingNote className="note-c" src="/ringgit-rm50.jpg" />
        <FloatingNote className="note-d" src="/korean-won-50000.jpg" />
        <FloatingNote className="note-e" src="/ringgit-rm50.jpg" />
        <FloatingNote className="note-f" src="/korean-won-50000.jpg" />
        <FloatingNote className="note-g" src="/ringgit-rm50.jpg" />
        <FloatingNote className="note-h" src="/korean-won-50000.jpg" />
      </div>
      <main className="app-shell" data-theme={theme}>
      <div className="scanline" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Won(da) Won dashboard home"><span className="brand-mark">WW</span><span>WON(DA) <b>WON</b><small>TRAVEL RATE PARTY</small></span></a>
        <a className="top-status" href="#signal-room"><span className="status-led" /> SIGNAL ROOM <span className="top-divider">/</span> MYR → KRW</a>
        <div className="topbar-actions">
          <button className="refresh-button" type="button" onClick={() => { void refresh(true); void intraday.refresh(); }} disabled={refreshing || intraday.loading}>
            <span className={refreshing || intraday.loading ? 'spin' : ''}>↻</span> {refreshing || intraday.loading ? 'CHECKING' : 'REFRESH'}
          </button>
          <button className="theme-toggle" type="button" onClick={() => setTheme((active) => active === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'light'}>
            <span aria-hidden="true">{theme === 'dark' ? '☼' : '☾'}</span> {theme === 'dark' ? 'LIGHT' : 'DARK'}
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="section-kicker">OPERATION SEOUL / EXCHANGE WATCH</span>
          <h1>Wait for the<br /><em>right moment.</em></h1>
          <p>Track the ringgit against the won. Bring your crew when the rate looks right.</p>
          <div className="hero-tags"><span>01 / WATCH</span><a href="#forecast">02 / PLAN</a><a href="#signal-room">03 / HEIST TOGETHER</a></div>
        </div>
        <div className="rate-ticket">
          <div className="ticket-top"><span>{useIntraday ? 'LATEST MARKET RATE' : 'DAILY REFERENCE RATE'}</span><span className={`live-label ${(useIntraday ? !intraday.fresh : rateStale || !rateVerified) ? 'is-stale' : ''}`}><i /> {displayedStatus}</span></div>
          {displayedRate !== undefined ? <div className="hero-rate">{formatRate(displayedRate)}<span>KRW</span></div> : <div className="hero-rate hero-rate-wait">—<span>KRW</span></div>}
          <div className="ticket-bottom"><span>FOR RM 1.00</span><span>{useIntraday ? intraday.quote ? `${quoteTime(intraday.quote.observedAt)} MYT` : 'WAITING FOR QUOTE' : latest ? formatObservationDate(latest.date) : 'WAITING FOR DATA'}</span></div>
          <p className="chart-caption">{useIntraday ? <><a href="https://twelvedata.com" target="_blank" rel="noopener noreferrer">Twelve Data</a> · checked every 30 minutes while this page is visible. This rate changes throughout the day. The chart below uses Frankfurter’s daily reference rates for the selected dates, so its value can differ. Time shown is when this market quote was recorded.</> : 'Frankfurter · a daily reference rate; market prices can change throughout the day.'}</p>
          {intraday.error && <p className="chart-caption" role="status">{intraday.error} {intraday.quote ? 'Showing the last quote. ' : ''}Market-rate alerts paused.</p>}
          {useIntraday && intraday.quote && !intraday.fresh && !intraday.error && <p className="chart-caption" role="status">Quote is over 60 minutes old. Market-rate alerts paused.</p>}
        </div>
      </section>

      {(rateError || newsError || rateStale) && <div className="notice" role="status">
        <span className="notice-icon">!</span>
        <p><strong>{rateStale ? 'Rate data unavailable or out of date.' : 'Some feed data could not be refreshed.'}</strong> {rateError ? `Rate refresh failed: ${rateError}. ${rates ? 'Showing saved rate data.' : 'No saved rate is available.'}` : ''} {newsError ? `News refresh failed: ${newsError}.` : ''} Check the source date before making a travel decision.</p>
        <button type="button" onClick={() => void refresh(true)} disabled={refreshing}>TRY AGAIN</button>
      </div>}

      <section className="dashboard-section">
        <div className="section-title-row"><div><span className="section-kicker">MARKET TAPE / RATE HISTORY</span><h2>Rate surveillance</h2></div><span className="panel-counter">DATA FEED <b>{rateStatus}</b></span></div>
        <div className="market-panel">
          <RateSurveillance rates={rates} rateStale={rateStale} rateError={rateError} refreshing={refreshing} rateVerified={rateVerified} onRefresh={() => void refresh()} />
        </div>
      </section>

      <ForecastCards rates={rates} news={news} lastRefresh={lastRefresh} />
      <SignalRoom rate={roomRate} />
      <NewsBanner snapshot={news} stale={Boolean(newsError)} error={newsError} onRefresh={() => void refresh(true)} />

      <section className="below-fold-note">
        <div className="note-mark">!</div><div><strong>Indicative rates, not a cash exchange quote.</strong><p>Charts and forecasts use daily reference observations. {useIntraday ? 'The main quote and room use Twelve Data. ' : ''}Rates may differ from what a bank, money changer, or transfer service offers.</p></div>
        <span className={`freshness ${combinedStale || Boolean(intraday.error) || (useIntraday && !intraday.fresh) ? 'is-stale' : ''}`}><i />{combinedStale || Boolean(intraday.error) || (useIntraday && !intraday.fresh) ? 'CHECK DATA' : 'SOURCES READY'}</span>
      </section>
      <footer className="footer"><span>WON(DA) WON // DEMO BUILD</span><span>{rates?.points.length ?? 0} OBSERVATIONS CACHED</span></footer>
      </main>
    </>
  );
}
