import { useCallback, useEffect, useState } from 'react';
import { NewsBanner } from './components/NewsBanner';
import { RateSurveillance } from './components/RateSurveillance';
import { SignalRoom } from './components/SignalRoom';
import { ForecastCards } from './components/ForecastCards';
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
  const [rates, setRates] = useState<RateSnapshot | null>(() => readCachedRates());
  const [news, setNews] = useState<NewsSnapshot | null>(() => readCachedNews());
  const [rateError, setRateError] = useState<string | null>(null);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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
    setRateError(null);
    setNewsError(null);
    const [rateResult, newsResult] = await Promise.allSettled([fetchRates(), fetchNews(forceNews)]);
    if (rateResult.status === 'fulfilled') setRates(rateResult.value);
    else setRateError(rateResult.reason instanceof Error ? rateResult.reason.message : 'Rate data could not be refreshed.');
    if (newsResult.status === 'fulfilled') setNews(newsResult.value);
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
  const combinedStale = rateStale || newsStale;

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
        <a className="brand" href="#top" aria-label="RinggitWon dashboard home"><span className="brand-mark">RW</span><span>RINGGIT<b>WON</b><small>TRAVEL RATE PARTY</small></span></a>
        <a className="top-status" href="#signal-room"><span className="status-led" /> SIGNAL ROOM <span className="top-divider">/</span> MYR → KRW</a>
        <div className="topbar-actions">
          <button className="refresh-button" type="button" onClick={() => void refresh(true)} disabled={refreshing}>
            <span className={refreshing ? 'spin' : ''}>↻</span> {refreshing ? 'CHECKING' : 'REFRESH'}
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
          <div className="ticket-top"><span>DAILY REFERENCE RATE</span><span className="live-label"><i /> {rateStale ? 'UNAVAILABLE' : 'LATEST'}</span></div>
          {latest ? <div className="hero-rate">{formatRate(latest.rate)}<span>KRW</span></div> : <div className="hero-rate hero-rate-wait">—<span>KRW</span></div>}
          <div className="ticket-bottom"><span>FOR RM 1.00</span><span>{latest ? formatObservationDate(latest.date) : 'WAITING FOR DATA'}</span></div>
        </div>
      </section>

      {(rateError || newsError || rateStale) && <div className="notice" role="status">
        <span className="notice-icon">!</span>
        <p><strong>{rateStale ? 'Rate data unavailable or out of date.' : 'Some feed data could not be refreshed.'}</strong> {rateError || newsError || 'Showing the last published observation.'} Check the source date before making a travel decision.</p>
        <button type="button" onClick={() => void refresh(true)} disabled={refreshing}>TRY AGAIN</button>
      </div>}

      <section className="dashboard-section">
        <div className="section-title-row"><div><span className="section-kicker">MARKET TAPE / RATE HISTORY</span><h2>Rate surveillance</h2></div><span className="panel-counter">DATA FEED <b>{rates ? '01 / OK' : '00 / WAIT'}</b></span></div>
        <div className="market-panel">
          <RateSurveillance rates={rates} rateStale={rateStale} lastRefresh={lastRefresh} onRefresh={() => void refresh()} />
        </div>
      </section>

      <ForecastCards rates={rates} news={news} onRefresh={() => void refresh(true)} />
      <SignalRoom rates={rates} />
      <NewsBanner snapshot={news} stale={Boolean(newsError)} error={newsError} onRefresh={() => void refresh(true)} />

      <section className="below-fold-note">
        <div className="note-mark">!</div><div><strong>Reference rate, not a cash exchange quote.</strong><p>Rate data comes from daily central-bank and official-source observations. The rate may differ from what a bank, money changer, or transfer service offers.</p></div>
        <span className={`freshness ${combinedStale ? 'is-stale' : ''}`}><i />{combinedStale ? 'CHECK DATA' : 'SOURCES READY'}</span>
      </section>
      <footer className="footer"><span>RINGGITWON // DEMO BUILD</span><span>{rates?.points.length ?? 0} OBSERVATIONS CACHED</span></footer>
      </main>
    </>
  );
}
