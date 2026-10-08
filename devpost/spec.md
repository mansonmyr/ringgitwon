---
doc: spec
status: approved
---

# MYR→KRW Travel Rate Party — Technical Spec

## How This Works, In Plain Language

The app is a website. React draws the dashboard, chart, forecast cards, party room, and roundtable in the browser. A free rate service supplies daily reference rates, and a free news service supplies links to recent stories. The browser uses the recent rates and a small, explainable news score to calculate experimental chances for the three forecast windows.

Firebase is the shared notebook for party rooms: it stores each room, its members and selected hangout area, shared target, roundtable votes, and alert events. Firebase also keeps the built website online. Travelers sign in anonymously behind the scenes, so they do not need to create a password. When someone is connected to a room, Firebase sends room changes to their open app, where the member sees the same alert or vote result.

The first public version stays on free service plans. Its exchange rate is a daily central-bank/reference rate, not a live dealer quote; it cannot promise a moment-by-moment market alert. The page checks for a newer observation at startup, when a traveler presses Refresh, and periodically while the tab is open. Connected room alerts appear in-app, play a short Web Audio tone, and use the browser Notification API when permission is granted. This works only while a room page remains open and connected; it is not push delivery after the app closes. The forecast is a transparent experiment, not a proven financial prediction. This shape keeps the app shareable without a paid data license, a payment card, or a custom always-on server.

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`.

1. The traveler opens the site. React requests the latest daily MYR/KRW reference rate plus headlines in all source languages for the current calendar month. It checks again on manual refresh and about hourly while the tab is open. When a provider publishes new data, the app refreshes the date and values; until then it shows the latest available date and labels it clearly.
2. The dashboard requests a two-week historical series. The app derives MYR/KRW by dividing the EUR→KRW series by the EUR→MYR series for matching dates, then draws the daily values, peak, and animated pointer in an SVG chart. Hovering or moving across the chart reveals a day's rate.
3. The Rate Surveillance component switches between its default 14-day chart and a Bi-Monthly tab. That tab requests a selected completed two-calendar-month period labeled across 2022–2026; it aligns the historical series, marks the period peak, exposes each day’s value, and lets the traveler scroll horizontally through the full daily chart. The compact period selector fits the control row. Each period is cached independently. In October 2026, August–September is the newest completed period.
4. The news panel requests the current calendar month from GDELT, keeps all returned languages, sorts newest first, and retains cached results with a clear stale/unavailable state if refresh fails. A refresh action is available when the feed fails.
5. The forecast module samples observed daily rate changes to create many possible paths for each calendar window. A small, explicitly experimental news signal adjusts the estimate and supplies the “Why?” explanation. The card shows a reach likelihood, factors, article links, update time, and uncertainty notice—not a predicted date.
6. A traveler enters a personal target or creates a room. Firebase Anonymous Authentication gives the browser a private member ID. Creating a room writes a new six-digit code, room master, initial shared target, avatar, initial Seoul / Night Watch location, and member record to Realtime Database. A friend enters a code; if it is missing, the app shows the agreed “No room found” prompt.
7. Room members listen to the same Firebase room record. Each member can select Seoul / Night Watch or Common Room; the location is saved on their member record and the scene places their avatar in that area for all connected members. Test Alert writes a new alert event once. Connected browsers show the same on-screen buzz and sound; members who granted browser notification permission also receive a notification while the page is open. When a newly published daily rate reaches the shared target, the app writes a target-reached event. While the rate remains above target, each connected app can display a repeat buzz every 1.5 hours; it stops when a newer rate falls below target.
8. A member raises a timed roundtable. Votes are saved under that round. At expiry, the app counts missing votes as Hold, excludes Holds, and applies the agreed Follow/Fold rule. A tie lets the raiser extend or close. All Hold leaves the target unchanged and asks members if they want to revote.

```text
Rate/news services ──→ browser fetch + calculations ──→ dashboard, chart, forecast
                                  │
                                  └── rate crossing ───┐
                                                      ↓
Traveler browser ←── live room updates ── Firebase Realtime Database
       │                       ↑
       ├── create/join/vote ───┘
       └── Firebase Hosting serves the website
```

## Stack

- **TypeScript + React + Vite.** TypeScript catches common mistakes while the app is being built; React gives the dashboard and room reusable pieces; Vite provides a quick local preview and production build. [React documentation](https://react.dev/learn), [TypeScript documentation](https://www.typescriptlang.org/docs/), [Vite guide](https://vite.dev/guide/).
- **Firebase Web SDK: Anonymous Authentication and Realtime Database.** This supplies low-friction member IDs and synchronized room data. Set database access rules before deployment; do not leave the database publicly writable. [Firebase Web setup](https://firebase.google.com/docs/web/setup), [Anonymous Authentication](https://firebase.google.com/docs/auth/web/anonymous-auth), [Realtime Database for Web](https://firebase.google.com/docs/database/web/start), [Realtime Database security rules](https://firebase.google.com/docs/database/security).
- **Firebase Hosting.** Recommended free static hosting for the public demo, kept in the same project as the room database. Spark has quotas and shuts off an over-quota product for the rest of the billing month rather than charging for overage; no payment details are required for Spark. [Firebase pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [Firebase Hosting](https://firebase.google.com/docs/hosting).
- **Native SVG for the chart and pixel meters.** Avoids adding a chart library during this short first build.
- **No AI model service.** The forecast is a local, reproducible statistical experiment plus a small rule-based news signal. It does not call an LLM or claim trained-market-model accuracy.

## Where It Runs and How Someone Tries It

The app runs in a modern browser and is also served as a static site. Node.js/npm are used to install packages and run the local development server. A free Firebase account is needed to deploy a shared room database and public website. The browser Firebase configuration is public by design; database rules and Authentication protect room data. There are no Twelve Data, Wise, or other private market-data keys in this version.

Local preview:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). To try real room syncing locally, add the Firebase web-app settings to `.env.local` using the names documented in `.env.example`, then run the development command again. Without Firebase settings, show a clear setup message; do not silently substitute fake shared-room behavior.

Public preview, after creating a Firebase project on Spark and enabling Anonymous Authentication and Realtime Database:

```sh
npm run build
npx firebase-tools login
npx firebase-tools init hosting database
npx firebase-tools deploy --only hosting,database
```

Firebase CLI setup is interactive; select the existing project, use `dist` as the public directory, configure the single-page app rewrite, and point the database setup at the included rules file. Create/enable the Realtime Database instance in the Firebase console first. Exact prompts can change, so the build step should verify them against the current [Firebase Hosting quickstart](https://firebase.google.com/docs/hosting/quickstart).

For the required demo recording, open the deployed URL in two browser windows (or two devices), create/join one room, and demonstrate a Test Alert and a roundtable. Then show the two-week graph, current reference-rate timestamp, three forecast cards, and one linked story. Submission requires a short demo video and a public GitHub repository. Deployment is optional for the Devpost submission, but it is included here because the learner wants other people to try the app.

## Look and Feel

Use a dark midnight-blue and ink palette with bright pixel accents (mint, electric cyan, and warm amber), crisp monospace labels paired with a readable sans-serif for longer explanations, and a compact “hacker watching the rate” dashboard. Pixel styling belongs on avatars, meters, alerts, and room details; the chart and rate remain easy to read. Match the small custom cursor to the learner’s snapshot: black arrow fill, bright white outline, and soft cyan glow on every clickable element. Use actual images of Bank Negara Malaysia's RM50 note and the Bank of Korea's 50,000-won note; let eight note instances flow naturally across the viewport without pointer interaction. Keep the original artwork colors and the Bank of Korea specimen marking intact in either theme. Disable animation under `prefers-reduced-motion`. Add a saved dark/light switch that inverts interface colors. Remove the “REFERENCE ONLY” stamp from the rate ticket while keeping clear text about daily reference-rate limitations elsewhere. The party room uses a cozy magical-school common-room backdrop with simple CSS/SVG avatar idle and walk animations. Follow the Codédex-inspired visual gamification from `prd.md > Look and Feel`; do not add XP, badges, or game rewards. Use original generic fantasy-room art and wording rather than copying Harry Potter characters, logos, or artwork.

## Components

### App shell and navigation

Owns the dashboard, party-room, and roundtable views; holds the signed-in anonymous member identity and handles loading, error, and navigation states.

Implements `prd.md > The Core Journey` and `prd.md > States and Boundaries`.

### Rate data service and dashboard

Fetches daily historical reference observations, aligns the two EUR-based series, converts them into KRW per RM1, caches the last successful result in local storage, and marks the observation date. Refresh asks the provider for current observations. The app fetches at startup, on request, and about hourly while visible; it labels rate data stale after 3 calendar days without a newer observation so weekends/holidays do not immediately trigger a false alarm. The graph covers the latest 14 calendar days with available observations, marks the highest value, animates today's pointer, and exposes selected-day details. If a date has no publication (weekend/holiday), show a gap or the latest published point; do not invent a value.

Implements `prd.md > Rate Dashboard and Graph`.

### Bi-Monthly rate-history tab

Adds a **Bi-Monthly** tab alongside the existing **14 Days** view in Rate Surveillance. It offers completed consecutive two-calendar-month periods labeled across 2022–2026, newest first (e.g. Aug–Sep 2026, Jun–Jul 2026, Apr–May 2026 when the current month is October 2026). The compact selector fits the control row. A period label includes both months and years when the pair crosses a year boundary. The current incomplete period and any future dates are not selectable. Selecting a period requests its full date range from Frankfurter, aligns the EUR/MYR and EUR/KRW rows by date, derives KRW per RM1, and shows the period’s highest observed value plus selectable daily details. The chart scrolls horizontally so the daily points stay readable. Cache each period in local storage using its date-range key so previous selections are immediate and stale/offline states retain their last result. Missing non-business days remain gaps; the rate service does not provide minute-level activity.

Implements `prd.md > Bi-Monthly Rate Surveillance`.

### News banner and forecast engine

Fetches broad finance, policy, conflict, and trade headlines from GDELT, links each result to its publisher, and shows headline/source/date in a scrollable list. Fetch the current calendar month in Kuala Lumpur time; display a single current-month list. Keep every language returned by the source. If a request fails, show saved stories or a clear unavailable message with Refresh; never fill the feed with fabricated headlines. Headlines are marked stale after a day. The forecast engine takes a longer historical rate series, the target, the calendar-window boundaries, and a small, capped headline-polarity score from a transparent keyword list. It resamples consecutive calendar-day returns from the trailing year into simulated paths, using separate pools for each ending weekday (including weekends). Returns spanning missing dates are excluded; each weekday must have at least eight samples or the forecast shows an unavailable message. Holidays are not modeled separately. It estimates the share of paths that touch the target within each window, and adds the same-scale pixel meter and concise factors. News polarity is a basic keyword rule and is labelled heuristic; it may be wrong. Article tone/coverage is context, not evidence that a currency will move that way. If the rate history is older than 3 days, or no fresh news can be fetched and the cache is older than a day, show the refresh action and suppress a current forecast.

Implements `prd.md > Forecast Cards and News`.

### Currency cursor and banknote background

Use a small custom SVG cursor matching the supplied screenshot (black fill, white edge, soft cyan glow) consistently over clickable elements. Use actual images of Bank Negara Malaysia's RM50 note and the Bank of Korea's 50,000-won note; eight note instances flow across the viewport behind the app content and are not interactive. Keep the original artwork colors and the Bank of Korea specimen marking intact in either theme. Disable animation under `prefers-reduced-motion`. Include a dark/light toggle which applies the inverse color treatment to the interface and saves the selection in local storage.

Implements `prd.md > Currency visuals and cursor`.

### Personal target and alert controller

Stores a solo target in local storage. In a room it reads the master-set shared target. On a newly dated rate observation, it checks whether the target was crossed and publishes one idempotent room alert event. Connected clients show that event. While the latest published rate remains at/above target, connected clients show local repeat buzzes each 90 minutes; this timer is in the open browser and is not a closed-app notification.

Implements `prd.md > Target and Alerts`.

### Party room and avatars

Creates and joins six-digit rooms, shows the room master, shared target, members, avatars, and room status. Firebase Anonymous Authentication provides a stable member ID in that browser. Room presence uses Firebase connection status and `onDisconnect` cleanup. Members choose between Seoul / Night Watch and Common Room; that choice is stored in Firebase, and all connected clients render each avatar in its selected area. Avatars are selected from a small built-in set or assigned automatically for the first version; names are nicknames typed by the traveler, not verified identities. The room is a shared browser scene with simple stand/walk animations, not a multiplayer game engine. New alert events play a short Web Audio tone and show a browser notification when permission is granted. Permission is requested through a user action; this browser-side approach cannot deliver after the page closes.

Implements `prd.md > Party Rooms and Avatars`.

### Roundtable

Writes the proposal, duration/deadline, and each member's Follow/Fold/Hold choice to the room. Connected clients observe the same round. At expiry, the connected room master reads server-frozen ballots and uses a transaction to resolve the round once: Follow greater than Fold changes the target, Fold greater than Follow keeps it, a tie waits for the raiser's extend/close choice, and all Hold prompts a revote. Only connected in-app participants are notified.

Implements `prd.md > Roundtable Target Changes`.

## Data Model

| Data | Where it lives | How it changes and what returning looks like |
|---|---|---|
| Firebase settings | `.env.local` (ignored by Git); variable names in `.env.example` | Read when Vite starts/builds. Firebase web configuration is not a secret; security comes from Auth and database rules. |
| Last rate response and date | Browser local storage | Updated after a successful Frankfurter fetch. On return, show cached value with its timestamp while refreshing; if refresh fails, label it stale/unavailable. |
| Bi-monthly historical series | Browser local storage, keyed by period start/end dates | Each selected two-month period labeled 2022–2026 is cached with its observation dates and fetch time; refresh the selected period on demand. |
| Personal target, nickname, avatar choice | Browser local storage | Saved immediately and restored in that browser. |
| News headlines and fetched-at time | Browser local storage | Refresh the current-calendar-month list from GDELT; restore cached links while marking them stale if the fetch fails. |
| User identity and room membership | Firebase Anonymous Auth and Realtime Database | Auth ID persists for that browser installation. Room data is shared across devices by room code while rules permit access. Clearing browser data creates a new identity. |
| Shared room | Firebase Realtime Database at `/rooms/{sixDigitCode}` | Stores master UID, shared target, member records, current alert state, and active/completed roundtable. Room code is shareable; avoid storing email addresses, passwords, or sensitive information. |
| Member location | Firebase Realtime Database at `/rooms/{sixDigitCode}/members/{uid}/location` | `nightWatch` or `commonRoom`; updated when the traveler selects an area and synchronized to room listeners. Older records without this field are treated as Seoul / Night Watch. |
| Forecast estimate | Recomputed in the browser from historical rates, target, and current fetched headlines | Not treated as a durable truth. Store its inputs/update time only if needed for display; recompute when the target or fetched data changes. |

Simplified room record:

```json
{
  "masterUid": "anonymous-auth-uid",
  "sharedTarget": 190,
  "members": { "anonymous-auth-uid": { "name": "Traveler", "avatar": "traveler-1", "online": true, "location": "nightWatch" } },
  "alert": { "eventId": "rate-date-or-test-id", "kind": "test", "createdAt": 0, "lastRateDate": "YYYY-MM-DD" },
  "roundtable": { "id": "round-id", "proposal": 191, "deadline": 0, "status": "open", "votes": { "anonymous-auth-uid": "follow" } }
}
```

Use Firebase server timestamps where available. Database rules should require authentication, validate room/member paths and simple field types, and limit writes to a member's own vote/profile/location plus allowed shared actions. This first client-only proof of concept does not have a trusted backend enforcing every voting rule; do not put personal information in rooms or treat its room master/voting rules as tamper-proof. A hardened public product would need server-validated room actions and abuse controls.

## File Structure

```text
project/
├── index.html                     # Vite page entry
├── package.json                   # Scripts and dependencies
├── vite.config.ts                 # Vite + React configuration
├── tsconfig.json                  # TypeScript settings
├── .env.example                   # Documented Firebase setting names, no secrets
├── .gitignore                     # Excludes local env and generated files
├── firebase.json                  # Hosting configuration and SPA rewrite
├── database.rules.json            # Firebase Realtime Database access rules
├── src/
│   ├── main.tsx                   # Starts the React application
│   ├── App.tsx                    # App shell and screen selection
│   ├── styles.css                 # Pixel-heist theme, room, responsive layout
│   ├── lib/
│   │   ├── firebase.ts            # Firebase setup and anonymous sign-in
│   │   ├── rates.ts               # Latest and selected-month Frankfurter history, cross-rate, stale cache
│   │   ├── news.ts                # GDELT query and headline normalization
│   │   ├── forecast.ts            # Historical-return simulation and news heuristic
│   │   ├── rooms.ts               # Room creation, joining, presence, subscriptions
│   │   ├── roundtable.ts          # Vote and outcome rules
│   │   └── alerts.ts              # Target crossing, test event, repeat timer
│   ├── components/
│   │   ├── RateChart.tsx          # Two-week SVG graph and selected-day tooltip
│   │   ├── RateHistory.tsx        # Bi-Monthly period tabs and historical graph
│   │   ├── ForecastCards.tsx      # Three likelihood cards and pixel meters
│   │   ├── NewsBanner.tsx         # Linked stories and refresh/stale state
│   │   ├── PartyRoom.tsx          # Room scene, members, target and test alert
│   │   └── RoundtablePanel.tsx    # Follow/Fold/Hold interaction and timer
│   └── types.ts                   # Shared TypeScript data shapes
├── devpost/
│   ├── learner-profile.md         # Learner planning record (gitignored)
│   ├── scope.md                   # Approved project scope
│   ├── scope.html                 # Visual scope review
│   ├── prd.md                     # Approved product requirements
│   ├── prd.html                   # Visual PRD review
│   ├── spec.md                    # This canonical technical plan
│   └── spec.html                  # Visual technical-plan review
└── README.md                      # Setup, configuration, demo, and deploy notes
```

## External Services and Dependencies

### Frankfurter daily reference rates

- **Use:** Keyless daily rates and history from central banks and other official sources; no user account or payment method. [Official API docs](https://frankfurter.dev/).
- **Requests:** `GET https://api.frankfurter.dev/v2/rates?base=EUR&quotes=MYR,KRW` for latest observations; historical series uses the same endpoint with `from=YYYY-MM-DD&to=YYYY-MM-DD` for either the two-week graph or one selected two-month period. The archive covers completed periods labeled 2022–2026. Align dates and calculate `MYR→KRW = rate(EUR,KRW) / rate(EUR,MYR)`.
- **Response:** Rows like `{ "date": "2026-10-07", "base": "EUR", "quote": "KRW", "rate": 1700.1 }`.
- **Freshness/cost:** Rates update daily (and may be non-business-day old); service describes no daily/monthly cap but rate-limits abuse. These are reference rates, not cash-exchange kiosk quotes or a minute-by-minute Forex feed.
- **Build check:** Confirm both MYR and KRW are available from the selected sources and share dates. If not, keep the stale-data/unavailable state and test another official-provider route; never fabricate missing rates.

### GDELT DOC news search

- **Use:** Recent links across global news coverage for the broad subjects in the PRD; no account key in the documented examples. [GDELT DOC API overview and examples](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/).
- **Requests:** The app requests the current calendar month through the present time with `startdatetime`/`enddatetime`, `maxrecords=250`, and `sort=datedesc`. Keep request starts at least six seconds apart. If the provider fails, show cached current-month headlines or an unavailable state with Refresh.
- **Response/use:** Article list metadata (headline, publisher/source, date, and original URL); open the publisher URL in a new tab. Display the data date and do not republish article text.
- **Limits:** Public API has no documented guarantee of uptime or a formal quota in the referenced overview; cache for a short period and provide refresh/failure UI. GDELT coverage and automated tone are imperfect and should not be called a financial signal of known accuracy.

### Firebase Spark

- **Use:** Hosting for the website, Anonymous Authentication, and Realtime Database for synchronized rooms. [Spark pricing and limits](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [Firebase Authentication](https://firebase.google.com/docs/auth), [Realtime Database](https://firebase.google.com/docs/database).
- **Requests:** Firebase web SDK reads/writes to a configured database; member clients subscribe to `/rooms/{roomCode}` so room changes arrive without manually refreshing. Browser config is public. No service account key is used in the browser.
- **Cost/limits:** Spark no-cost quotas require no billing account; when a quota is exceeded Firebase shuts that product off for the rest of that month. This is suitable for a small demo, not a usage guarantee for a larger public service. Cloud Functions are outside this no-billing setup, so no scheduled backend or background notifications are planned.
- **Security:** Anonymous sign-in plus database rules. Do not use open read/write rules. Client-side permissions are a POC boundary; production hardening is deferred.

### Alternatives checked for live-rate use

- [Wise API](https://docs.wise.com/api-reference/rate/rateget) supports current and historical rates, but the documented API requires credentials; public partner access involves onboarding, while personal tokens are limited to eligible Wise business accounts. Not the straightforward keyless public source needed here.
- [Google Finance data API status](https://developers.google.com/gdata/docs/directory) lists the old Portfolio Data API as shut down with no replacement. Use a Google Finance page as a human reference only, not scrape it as an app API.
- Yahoo pages are not a supported feed for this app. Yahoo’s [service terms](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html) restrict automated access except through provided interfaces and restrict reuse of its content/data. Do not scrape Yahoo Finance or depend on unofficial endpoints.
- [FOREX.com API trading](https://www.forex.com/en-us/premium-trader-tools/api-trading/) requires a trading account, funding, and a request to enable API access. Its live prices are tied to the trading integration; it is not the selected no-cost public display source.
- Twelve Data is now an optional local intraday integration requested by the learner. `server/twelveData.ts` provides `/api/intraday-rate` through Vite development/preview middleware, using a server-only `TWELVE_DATA_API_KEY`. A fixed MYR/KRW request, coalesced requests, and a five-minute per-process cache limit upstream calls. `src/lib/intraday.ts` polls while visible and checks the provider timestamp. Main ticket/room use the configured quote; daily charts/forecasts retain Frankfurter. Stale (>10 minutes) or failed quotes suppress automatic room rate alerts, and crossings need two recent quotes. Actual pair entitlement remains unverified until credentials are supplied. [Terms](https://twelvedata.com/terms) require appropriate public-display/redistribution access; no public deployment or paid plan is provisioned. Static Hosting alone cannot run this endpoint; deployment requires a server route and shared cache.

## Important Failure Modes

- **Rate or news request fails / data is stale** → retain the last known rate and timestamp; mark rates stale after 3 calendar days and headlines stale after 24 hours, show Refresh, and hide the forecast if its inputs are not current enough.
- **MYR/KRW cross-rate is unavailable on a date** → skip that date; if current data cannot be formed from both component rates, show unavailable instead of a made-up value.
- **Firebase setup, quota, or connection fails** → explain that shared rooms are unavailable, retain solo dashboard use, and show a reconnect/refresh action. Do not pretend room sync worked.
- **Firebase quota shuts off a free feature** → app shows its last local rate cache and a service-unavailable message; room sync/hosting resumes when the quota resets or the owner changes plans.

## What Was Simplified and Why

- **Daily official reference rates** instead of minute-by-minute dealer/Forex quotes — free and suitable for a publicly viewable demo; the tradeoff is that natural crossing alerts happen only when a fresh daily observation arrives.
- **Browser calculations with an explainable, experimental simulation** instead of a hosted ML service — keeps the forecast working without paid model access or a backend; the estimate is not calibrated or validated for financial decisions.
- **Browser notifications while connected** instead of push while the app is closed — preserves the shared “buzz” using native browser notifications and sound without a background messaging service.
- **Anonymous identities and a simple avatar set** instead of passwords, profiles, or custom avatar art — reduces setup while still letting a room show its travelers.
- **A client-only first party room** instead of a secured production service — retains synchronized rooms for the core demo, but room decisions are not tamper-proof and must not store sensitive information.

## Decisions and Open Issues

### Decisions agreed with the learner

- Keep the public first version free; use daily reference-rate data and show its real publication time rather than claiming a live dealer quote.
- Use a working but clearly experimental forecast that combines historical rate movement with a basic news signal; show uncertainty and do not present a guaranteed result.
- Continue toward a public URL and create free provider accounts where needed; no paid account or payment method is part of the approved first-version constraint.
- Keep the existing MYR/KRW, two-week dashboard, news links, forecast cards, rooms, test/live threshold alert, and timed roundtable behavior from the approved PRD.
- Add a Bi-Monthly tab in Rate Surveillance for completed two-month periods labeled across 2022–2026, current/previous/two-month-prior news tabs, a smaller snapshot-matched cursor on all clickable controls, full-background animated actual Ringgit/Won banknotes, a saved dark/light inverse-color switch, and removal of the rate-card stamp based on preview feedback.

### Recommended implementation choices for review

- React + TypeScript + Vite, Firebase Spark (Hosting, Anonymous Auth, Realtime Database), Frankfurter for daily rates, and GDELT DOC for headlines. These keep rate/news access keyless and the public deployment within no-cost services, at the cost of daily rather than minute-level rates and free-tier limits.
- Six-digit room code is randomly generated and checked against the database before creation. Avatars use a small built-in set; travelers may choose a nickname and avatar, with a default assignment.
- “Next 3 months” means the three full calendar months after the current month. Forecast simulations run through each calendar boundary using observed business-day changes.

### One useful unknown and how to check it

The learner asked whether free live rates could come from Wise, Google, Yahoo Finance, or FOREX.com. The lookup clarified that a rate shown on a website is not necessarily an app API: Google’s legacy data API is shut down, Yahoo is not an approved scrape source, Wise requires API credentials/partner access, and FOREX.com’s API is attached to a funded trading account. During the first build, verify Frankfurter returns both MYR and KRW on aligned dates; if that fails, keep the app’s unavailable state and bring back a source choice before changing the cost/licensing boundary.

### Still unresolved, not blocking the draft

- The exact palettes/font names can be selected during styling while preserving the pixel-heist direction.
- The news query’s relevance and the forecast’s numerical behavior need a small build-time review with example dates and headlines. The probability is explicitly experimental and not a validated forecast.
- Anonymous room rules and client-resolved voting are suitable only for the proof of concept. Server-validated authorization, abuse prevention, data retention policy, broader access, and licensed market data must be designed before relying on this as a production service for the public.

- Forecast implementation uses approximately one year of history, a minimum of 60 observations, 2,000 deterministic bootstrap paths, and a directional English-headline adjustment capped at ±0.005% daily that fades over 14 calendar days. Other languages remain in the feed and have neutral model influence. Method limitations are disclosed beside the cards.

- Roundtable implementation: ballots live separately from proposal metadata, each writable only by its authenticated member before the server-enforced deadline. The existing room master remains the trusted finalizer; if disconnected, finalization waits for it to rejoin. Accepted targets and the applied flag update atomically. Firebase rules cannot aggregate arbitrary ballot maps, so this client-only demo does not claim independent server verification of the master’s tally. Voting duration is 15 seconds–24 hours. New arrivals may vote while the table is open; existing ballots remain counted after a member disconnects.
