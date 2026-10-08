# RinggitWon — MYR / KRW Watch

The app includes a browser dashboard for daily MYR→KRW reference rates and recent international news, plus Firebase-backed Signal Rooms for travelers to share a target and send a synchronized Test Alert. The graph uses published daily observations, so weekends and holidays can leave gaps and the rate is not a live money-changer quote. Headlines show the current calendar month only, with cached stories retained when GDELT is unavailable.

## Run locally

Install dependencies and start the local server:

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The port is fixed; Vite stops with an error if another process occupies it. The dashboard fetches the latest available observations and headline links when it opens, when Refresh is pressed, and about hourly while the page is visible. It keeps the last successful response in this browser if a refresh fails. The dashboard marks that response as saved data and shows its last successful fetch time separately from the rate observation date. A refresh attempt does not advance that fetch timestamp. These are daily reference rates, so they can differ from intraday Google Finance or Apple Stocks quotes.

## Optional Twelve Data intraday quote

The local development/preview server supports a server-side Twelve Data quote for `MYR/KRW`. To activate it:

1. Obtain a [Twelve Data API key](https://twelvedata.com/forex) and confirm your account can access `MYR/KRW` through the exchange-rate endpoint. Pair access has not yet been verified for this project.
2. Add `TWELVE_DATA_API_KEY=your_key_here` to your existing, ignored `.env.local`. Keep the Firebase settings. Do **not** prefix this key with `VITE_` or paste it into browser code.
3. Restart `npm run dev`. The main ticket should say **INTRADAY EXCHANGE RATE**, show Twelve Data attribution, and show its quote timestamp in MYT. Rejected credentials, unsupported pair/plan access, and provider failures show an unavailable state.

The browser checks every five minutes while visible. `/api/intraday-rate` fetches only the fixed pair, coalesces concurrent requests, and caches successful and failed attempts for five minutes per server process. Refresh respects this cache. This is approximately 288 upstream calls per day for one continuously used process; restarts and multiple instances can increase usage. With no key, the app continues to use clearly labeled daily reference data.

The main quote and Signal Room use Twelve Data when configured. Quotes older than ten minutes or a failed refresh pause automatic rate alerts; the last quote stays visible with its timestamp. Crossings require two recent observations received during this visit; the first fetch does not invent a previous quote. Charts continue to use Frankfurter daily history. Forecasts offer separate five-year histories from Frankfurter and Twelve Data, without mixing intraday observations or joining provider series. Browser polling is not 24/7 background monitoring and can miss crossings between polls.

This route runs with `npm run dev` and `npm run preview`; it is **not included as a backend in the static `dist` output**. Public hosting needs a server/serverless route with this secret and shared caching. Vite preview is for local previews, not a production server. Before public display, confirm the required plan/redistribution rights with Twelve Data; [its terms](https://twelvedata.com/terms) and [attribution guidelines](https://support.twelvedata.com/en/articles/12647398-attribution-guidelines-for-using-twelve-data) apply. Attribution alone does not grant display rights. No paid plan or deployment has been provisioned.

## Enable Signal Rooms

Room syncing uses Firebase Anonymous Authentication and Realtime Database on the no-cost Spark plan. To enable it:

1. Create a Firebase project and add a web app in the [Firebase console](https://console.firebase.google.com/).
2. Copy the web app values into a new `.env.local`, using the names in `.env.example`. The browser config is public; never put a service-account key in this file.
3. Enable **Anonymous** sign-in in Authentication.
4. Create a Realtime Database, copy its database URL into `VITE_FIREBASE_DATABASE_URL`, and apply the rules from `database.rules.json`.
5. Restart `npm run dev`. The Signal Room can then create/join six-digit rooms, show live members, share the room-master target, and sync Test Alerts.

Without those settings, the app explains what is needed and keeps the room actions disabled. Room data is client-synchronized for the demo; do not store personal information in a room.

## Data sources

- [Frankfurter](https://frankfurter.dev/) for daily reference rates and rate history.
- [Twelve Data](https://twelvedata.com/) for an optional intraday quote (requires server-side configuration and account access).
- [GDELT DOC](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) for recent headline links.

The chart and forecasts are informational and do not guarantee an exchange outcome. This project does not exchange money.

## Banknote artwork

- `public/ringgit-rm50.jpg` is a resized, optimized copy of the RM50 image from [Bank Negara Malaysia's RM50 page](https://www.bnm.gov.my/currency/banknotes/-/asset_publisher/bUDWhag9otfb/content/currency-banknotes-rm50). The image retains the note's original design and color.
- `public/korean-won-50000.jpg` is the 50,000-won front image from the [Bank of Korea's banknotes page](https://www.bok.or.kr/static/eng/img/cts/old/money_five_img06.jpg). Its visible Korean specimen mark remains in the image.
- Currency reproductions follow the published [Bank Negara Malaysia reproduction guide](https://www.bnm.gov.my/documents/20124/39730/en_reproduction_guide.pdf) and [Bank of Korea reproduction guidelines](https://www.bok.or.kr/eng/main/contents.do?menuNo=400057).

## Experimental forecast

Set a personal target in the Plan section and choose Frankfurter or Twelve Data. Three cards use 2,000 simulated paths sampled from the selected provider’s trailing five years of available daily observations. The actual date span and usable observation count are shown; unavailable history stays explicitly unavailable. Frankfurter retains calendar-day sampling. Twelve Data uses completed UTC weekday closes, includes Friday-to-Monday returns, excludes other missing-weekday gaps and weekend bars, and holds simulated rates flat on weekends. Each provider’s estimate starts at its own latest historical observation. Histories are never spliced or averaged together. They compare this calendar month, next month, and the next three full calendar months in Kuala Lumpur time. The method disclosure explains the small, fading English-headline heuristic. Preliminary historical evaluation found underestimation of target hits; these remain experimental scenarios, not reliable real-world probabilities. Stale/missing inputs suppress the estimates. Personal targets are saved in browser storage. Five-year model variants have not yet been backtested or calibrated; the reports below describe earlier one-year models. More history includes more market conditions but does not automatically improve accuracy. Twelve Data history is fetched through the server-only `/api/rate-history` endpoint, cached for six hours per process (failed attempts for five minutes), with a fixed five-year MYR/KRW range. Historical bars for the current UTC day are excluded. This route also requires a backend when deploying; it is available locally via Vite development/preview. Official [historical API guidance](https://support.twelvedata.com/en/articles/5214728-getting-historical-data) documents date bounds and the 5,000-row maximum; five years of daily bars fits one request.

### Forecast evaluation and MiroFish experiment

The [historical report](devpost/validation/forecast-backtest.md) evaluates 393 overlapping cases using historical monthly origins and targets 1%, 3%, and 5% above the starting rate. Each forecast sees only its trailing year. The next-month mean estimate was 20.5%, versus 34.1% observed target hits. The simulator beats the no-change baseline but loses to a simple historical-frequency baseline for the first two horizons. Cases are correlated; this is exploratory evidence, not an independent accuracy claim. Those figures describe the preserved original model.

The [calendar-corrected report](devpost/validation/forecast-calendar-v2.md) repeats the same cases with one-day changes sampled separately for each day of the week, including weekends. Missing-date returns are excluded, and eight samples per weekday are required. Next-month estimates average 26.5%, with lower probability error than the original model, but underestimation remains. This is development-data evidence, not an untouched holdout. The next-month score is approximately tied with the historical-frequency comparator.

Reproduce the corrected report from the saved snapshot and run focused implementation checks (the original report is preserved):

```sh
npm run check:forecast
npm run backtest:forecast -- --as-of=2026-10-08
```

The backtest excludes news because a historical news archive was not supplied. [MiroFish setup research and experiment protocol](devpost/mirofish-experiment.md) and a [historical rehearsal packet](devpost/mirofish-rehearsal.md) are ready. No MiroFish simulation has been executed. Its qualitative scenarios must be evaluated separately before influencing numerical forecasts.

## Remaining build work

The roundtable is implemented locally; publish the updated database.rules.json before using it. Multi-client roundtable verification and the final end-to-end review remain unfinished. Browser notifications require an open, connected page; closed-app push and continuous server monitoring are not implemented.

## Target roundtable

Any room member can propose a target and choose 0.25–1,440 voting minutes (15 seconds–24 hours). Follow agrees, Fold disagrees, and Hold abstains. Unanswered cards count as Hold when the deadline passes. Follow majority applies the target; Fold majority leaves it unchanged. A tie lets the proposer extend by the original duration or close the table. All-Hold prompts each traveler for a re-vote preference; any member can then raise a fresh round.

Publish the complete local `database.rules.json` in Firebase Console → Realtime Database → Rules → Publish. These rules protect each member's ballot and enforce voting deadlines using Firebase server time. The room master's connected browser remains the trusted authority for counting frozen ballots and applying the result. If the master disconnects, finalization waits until that same anonymous identity rejoins. This demo does not have a trusted server tally or a background worker.

Round metadata is stored at `rooms/{code}/roundtable`; ballots and re-vote preferences are stored by round ID under the same room. Dismiss Room deletes all of them with the room. Target application and its completion flag are saved atomically. A failed application can be retried without creating a new vote.
