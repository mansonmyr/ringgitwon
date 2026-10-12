# Won(da) Won — MYR / KRW Watch

<p align="center">
  <a href="https://wondawon.netlify.app">
    <img src="https://img.shields.io/badge/Launch_Live_Demo-00AD9F?style=for-the-badge&logo=netlify&logoColor=white" alt="Live Demo">
  </a>
</p>

The app includes a MYR→KRW dashboard, experimental target simulations, publisher headlines, and Firebase Signal Rooms for shared targets, timed votes and connected-page alerts. Twelve Data supplies the optional main market quote; Frankfurter supplies daily reference charts. News covers Malaysia, English South Korea and international reports for today and the previous two days in MYT, with a maximum of 30 per section.

Video Demo: https://youtu.be/ijPQza4NnNQ?si=PCJDo20lDB71bzUr <a href="https://youtu.be/ijPQza4NnNQ?si=PCJDo20lDB71bzUr"></a>

## Hackathon Planning Documents

Built using the Devpost Learn Skill Pack:
- [**`scope.md`**](scope.md) — Problem definition, audience, constraints & core journey
- [**`prd.md`**](prd.md) — Product requirements & functional acceptance criteria
- [**`spec.md`**](spec.md) — Technical architecture, state machine & API design
- [**`devpost/checklist.md`**](devpost/checklist.md) — Build slices & implementation verification


<img width="797" height="741" alt="dashboard" src="https://github.com/user-attachments/assets/9a49826c-986b-4304-a0a8-fdfbeb559484" />

## Run locally

Install dependencies and start the local server:

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The port is fixed; Vite stops with an error if another process occupies it. The dashboard fetches the latest available observations and headline links when it opens, when Refresh is pressed, and about hourly while the page is visible. It keeps the last successful response in this browser if a refresh fails. The dashboard marks that response as saved data and shows its last successful fetch time separately from the rate observation date. A refresh attempt does not advance that fetch timestamp. These are daily reference rates, so they can differ from intraday Google Finance or Apple Stocks quotes.

## Optional Twelve Data intraday quote

The local development/preview server supports a server-side Twelve Data quote for `MYR/KRW`. To activate it:

1. Obtain a [Twelve Data API key](https://twelvedata.com/forex) and confirm your account can access `MYR/KRW` through the exchange-rate endpoint. The configured development account returned MYR/KRW data; other accounts must confirm their own access.
2. Add `TWELVE_DATA_API_KEY=your_key_here` to your existing, ignored `.env.local`. Keep the Firebase settings. Do **not** prefix this key with `VITE_` or paste it into browser code.
3. Restart `npm run dev`. The main ticket should say **LATEST MARKET RATE**, show Twelve Data attribution, and show its quote timestamp in MYT. Rejected credentials, unsupported pair/plan access, and provider failures show an unavailable state.

The browser checks about every thirty minutes while visible. `/api/intraday-rate` fetches only the fixed pair, coalesces concurrent requests, and caches successful and failed attempts for thirty minutes per server process. Refresh respects this cache. This is approximately 48 upstream calls per day for one continuously used process; restarts and multiple instances can increase usage. With no key, the app continues to use clearly labeled daily reference data.

The main quote and Signal Room use Twelve Data when configured. Quotes older than sixty minutes or a failed refresh pause automatic rate alerts; the last quote stays visible with its timestamp. Crossings require two recent observations received during this visit; the first fetch does not invent a previous quote. Charts continue to use Frankfurter daily history. Forecasts offer separate five-year histories from Frankfurter and Twelve Data, without mixing intraday observations or joining provider series. Browser polling is not 24/7 background monitoring and can miss crossings between polls.

This route runs with `npm run dev` and `npm run preview`; it is **not included as a backend in the static `dist` output**. Public hosting needs a server/serverless route with this secret and shared caching. Vite preview is for local previews, not a production server. Before public display, confirm the required plan/redistribution rights with Twelve Data; [its terms](https://twelvedata.com/terms) and [attribution guidelines](https://support.twelvedata.com/en/articles/12647398-attribution-guidelines-for-using-twelve-data) apply. Attribution alone does not grant display rights. No paid plan or deployment has been provisioned.

## Enable Signal Rooms

Room syncing uses Firebase Anonymous Authentication and Realtime Database on the no-cost Spark plan. To enable it:

1. Create a Firebase project and add a web app in the [Firebase console](https://console.firebase.google.com/).
2. Copy the web app values into a new `.env.local`, using the names in `.env.example`. The browser config is public; never put a service-account key in this file.
3. Enable **Anonymous** sign-in in Authentication.
4. Create a Realtime Database, copy its database URL into `VITE_FIREBASE_DATABASE_URL`, and apply the rules from `database.rules.json`.
5. Restart `npm run dev`. The Signal Room can then create/join six-digit rooms, show live members, share the room-master target, and sync Test Alerts.

Without those settings, the app explains what is needed and keeps the room actions disabled. Room data is client-synchronized for the demo; do not store personal information in a room.

<img width="1280" height="720" alt="signal-room" src="https://github.com/user-attachments/assets/97258cd3-8a39-446a-93c7-7204959b8267" />

## Data sources

- [Frankfurter](https://frankfurter.dev/) for daily reference rates and rate history.
- [Twelve Data](https://twelvedata.com/) for an optional intraday quote (requires server-side configuration and account access).
- Malay Mail, The Korea Times and CNA RSS for publisher headline links (GDELT replaced).

The chart and forecasts are informational and do not guarantee an exchange outcome. This project does not exchange money.

## Banknote artwork

- `public/ringgit-rm50.jpg` is a resized, optimized copy of the RM50 image from [Bank Negara Malaysia's RM50 page](https://www.bnm.gov.my/currency/banknotes/-/asset_publisher/bUDWhag9otfb/content/currency-banknotes-rm50). The image retains the note's original design and color.
- `public/korean-won-50000.jpg` is the 50,000-won front image from the [Bank of Korea's banknotes page](https://www.bok.or.kr/static/eng/img/cts/old/money_five_img06.jpg). Its visible Korean specimen mark remains in the image.
- Currency reproductions follow the published [Bank Negara Malaysia reproduction guide](https://www.bnm.gov.my/documents/20124/39730/en_reproduction_guide.pdf) and [Bank of Korea reproduction guidelines](https://www.bok.or.kr/eng/main/contents.do?menuNo=400057).

## Experimental forecast

Set a personal target in the Plan section and choose Frankfurter or Twelve Data. Three cards use 2,000 simulated paths sampled from the selected provider’s trailing five years of available daily observations. The actual date span and usable observation count are shown; unavailable history stays explicitly unavailable. Frankfurter retains calendar-day sampling. Twelve Data uses completed UTC weekday closes, includes Friday-to-Monday returns, excludes other missing-weekday gaps and weekend bars, and holds simulated rates flat on weekends. Each provider’s estimate starts at its own latest historical observation. Histories are never spliced or averaged together. They compare this calendar month, next month, and the next three full calendar months in Kuala Lumpur time. The method disclosure explains the small, fading English-headline heuristic. Preliminary historical evaluation found underestimation of target hits; these remain experimental scenarios, not reliable real-world probabilities. Stale/missing inputs suppress the estimates. Personal targets are saved in browser storage. The five-year variants now have a retrospective rate-only evaluation; they are not calibrated probabilities. See the five-year report below. Earlier one-year reports remain preserved. More history includes more market conditions but does not automatically improve accuracy. Twelve Data history is fetched through the server-only `/api/rate-history` endpoint, cached for six hours per process (failed attempts for five minutes), with a fixed five-year MYR/KRW range. Historical bars for the current UTC day are excluded. This route also requires a backend when deploying; it is available locally via Vite development/preview. Official [historical API guidance](https://support.twelvedata.com/en/articles/5214728-getting-historical-data) documents date bounds and the 5,000-row maximum; five years of daily bars fits one request.

### Forecast evaluation and MiroFish experiment(future development)

The [historical report](devpost/validation/forecast-backtest.md) evaluates 393 overlapping cases using historical monthly origins and targets 1%, 3%, and 5% above the starting rate. Each forecast sees only its trailing year. The next-month mean estimate was 20.5%, versus 34.1% observed target hits. The simulator beats the no-change baseline but loses to a simple historical-frequency baseline for the first two horizons. Cases are correlated; this is exploratory evidence, not an independent accuracy claim. Those figures describe the preserved original model.

<img width="797" height="741" alt="forecasts" src="https://github.com/user-attachments/assets/fc685688-eb5e-469c-8011-ca1280cccbc0" />

The [calendar-corrected report](devpost/validation/forecast-calendar-v2.md) repeats the same cases with one-day changes sampled separately for each day of the week, including weekends. Missing-date returns are excluded, and eight samples per weekday are required. Next-month estimates average 26.5%, with lower probability error than the original model, but underestimation remains. This is development-data evidence, not an untouched holdout. The next-month score is approximately tied with the historical-frequency comparator.

Reproduce the corrected report from the saved snapshot and run focused implementation checks (the original report is preserved):

```sh
npm run check:forecast
npm run backtest:forecast -- --as-of=2026-10-08
```

The backtest excludes news because a historical news archive was not supplied. [MiroFish setup research and experiment protocol](devpost/mirofish-experiment.md) and a [historical rehearsal packet](devpost/mirofish-rehearsal.md) are ready. No MiroFish simulation has been executed. Its qualitative scenarios must be evaluated separately before influencing numerical forecasts.

## Remaining build work

The learner reports forecast target changes, the Shared Target refresh control and two-person Signal Room use work. The build checklist distinguishes these reports from exhaustive edge-case testing. Final review documentation, public repository, license, demo video and public hosting remain to be completed. Browser notifications require an open, connected page; closed-app push and continuous server monitoring are not implemented.

## Target roundtable

Any room member can propose a target and choose 0.25–1,440 voting minutes (15 seconds–24 hours). Follow agrees, Fold disagrees, and Hold abstains. Unanswered cards count as Hold when the deadline passes. Follow majority applies the target; Fold majority leaves it unchanged. A tie lets the proposer extend by the original duration or close the table. All-Hold prompts each traveler for a re-vote preference; any member can then raise a fresh round.

Publish the complete local `database.rules.json` in Firebase Console → Realtime Database → Rules → Publish. These rules protect each member's ballot and enforce voting deadlines using Firebase server time. The room master's connected browser remains the trusted authority for counting frozen ballots and applying the result. If the master disconnects, finalization waits until that same anonymous identity rejoins. This demo does not have a trusted server tally or a background worker.

Round metadata is stored at `rooms/{code}/roundtable`; ballots and re-vote preferences are stored by round ID under the same room. Dismiss Room deletes all of them with the room. Target application and its completion flag are saved atomically. A failed application can be retried without creating a new vote.

### Five-year probability evaluation

[Five-year backtest and statistical analysis](devpost/validation/forecast-five-year.md) evaluates monthly origins from 2020 onward with targets 1%, 3%, and 5% above the known rate. It uses only the previous five years, withholds same-date publications, requires complete outcomes, and disables the unavailable historical news adjustment. Results include Brier score, historical-frequency/no-change/one-year comparisons, reliability bins, AUROC, clipped log loss, target sensitivity, and approximate 95% moving-block bootstrap intervals with six- and twelve-month blocks. Cases are correlated, and provider data are revised downloads rather than original vintages.

Frankfurter underestimates target hits; Twelve Data averages are closer but do not establish calibration. Neither five-year variant clearly improves over one-year models within the paired uncertainty intervals. Do not treat the percentages as guaranteed or replace them with in-sample hit rates. Reproduce with `node scripts/backtest-five-year.mjs --as-of=2026-10-09`; raw snapshots remain private in ignored `.cache/backtest/`. The public report includes aggregated metrics and scored cases, with no API key or raw provider history.

## Optional Signal Room email notifications

Email signup, verification, unsubscribe controls, and room test-email dispatch are implemented in the UI. A separate [Workers Free + Brevo Free backend](email-worker/README.md) is prepared for 30-minute background target checks without upgrading Firebase Spark. It stores email subscriptions privately in Cloudflare D1, authenticates existing Firebase users, requires explicit consent and email verification, and suppresses duplicate send attempts.

**Not deployed or connected yet.** Leave `VITE_EMAIL_API_URL` blank until free accounts, a verified Brevo sender, Worker secrets and D1 setup are ready. No emails have been sent; only frontend compilation and Worker syntax have been checked. The email section clearly reports that sending is unavailable until connected. Quota limits, possible missed crossings and at-most-once delivery tradeoffs are documented in the setup guide. This is not a 24/7 delivery guarantee.

### Publisher headlines

The local `/api/news` endpoint reads Malay Mail Malaysia RSS, The Korea Times South Korea, Economy and Business English RSS, and CNA Business/World RSS. It uses fixed source URLs, a shared 30-minute cache and a one-minute retry delay after failures. Browser storage retains up to 30 headlines per section from the current and previous two calendar days in Malaysia time (90 total), with separate Malaysian/South Korean/international sections and per-feed successful-update timestamps. RSS is a rolling feed, not a complete archive. International coverage uses the publisher’s Business category plus World headlines matching business, war, trade-fair or aviation terms; title matching can miss relevant reports. Limits apply on cache reads, refreshes and display, with minute-by-minute expiry while the section is mounted. Reload uses a fresh 30-minute cache; manual refresh still respects the server cache. Failed sources keep saved reports without resetting their timestamps; forecasts can continue without fresh news.

This endpoint is included in Vite development and preview. Static-only hosting must provide an equivalent backend route. Only headlines, dates, attribution and links are displayed. Publisher terms still apply; CNA describes its feeds as for personal, non-commercial use—review rights before public/commercial distribution: https://www.channelnewsasia.com/rss . Malay Mail source: https://www.malaymail.com/feed/rss/malaysia . No GDELT account or news API key is required.

South Korean feed directory: https://www.koreatimes.co.kr/rss . The South Korea feed is original English reporting; the app does not machine-translate titles.

# Disclaimer
This repository was part of submission for DevPOST (Build With AI: BASICS 2026) Hackathon.
This project was developed using AI-assisted coding tools:
	•	Codex
    
Feel free to contact if you would like to share to the social media or re-creation of this repository.

# Citation
If you use this software, please cite it as: K.H.,Ooi.(2026).Won(da) Won. version: 1.0.0. date-released: 2026-10-10.https://github.com/mansonmyr/wonda_won

