---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [ ] **1. Open the live-feeling rate dashboard**
  Becomes usable: A runnable pixel-heist dashboard with real daily MYR→KRW reference data, the two-week chart and peak, today's marker, day inspection, a scrollable all-language headline list for the current calendar month, refresh, a small snapshot-matched cursor on clickable controls, naturally flowing real Ringgit/Won banknotes, a saved dark/light inverse-color switch that preserves banknote colors, and no “REFERENCE ONLY” stamp.
  Why now: Project setup and the unfamiliar rate/news sources are proved in the first visible behavior; the user’s first-preview feedback is included before the page foundation is committed.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Rate Dashboard and Graph`, `prd.md > Forecast Cards and News` (headline behavior), `prd.md > Currency visuals and cursor`
  Spec ref: `spec.md > Stack`, `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Rate data service and dashboard`, `spec.md > News banner and forecast engine`, `spec.md > Currency pointer and background art`, `spec.md > External Services and Dependencies`
  Build: Keep the two-week dashboard chart; fetch aligned Frankfurter data and current-month GDELT headlines without a language filter; render the scrollable article list, real official banknote images that flow naturally, the small black/white/cyan snapshot cursor on clickable controls, and the saved inverse-color theme switch without recoloring note artwork; remove the rate-ticket stamp; add last-known caching, refresh, and failure labels.
  Verify (mechanical): Run `npm run build`; run the local server and confirm the rate is shown, the news list scrolls through every returned in-range headline, provider failure shows the cached-list/stale state, and the browser console has no errors.
  Learner check: Open the dashboard, inspect another day, find the two-week peak, browse current-month headlines, open one original report, change the color mode, watch the banknotes flow, and press Refresh. Say what feels right or confusing before later slices depend on the layout.
  Commit: `Build rate dashboard, news, and currency visuals`

- [ ] **2. Set a target and compare working forecasts**
  Becomes usable: The traveler can set a personal minimum rate, return later to find it saved, and compare computed target-reach chances for this month, next month, and the next three full calendar months, with factors and uncertainty.
  Why now: The forecast depends on the rate history and news already proved in Slice 1; it adds the target input that party rooms will later share.
  PRD ref: `prd.md > Forecast Cards and News`, `prd.md > Target and Alerts` (solo target)
  Spec ref: `spec.md > News banner and forecast engine`, `spec.md > Personal target and alert controller`, `spec.md > Data Model`
  Build: Add the saved personal target; simulate possible paths from historical daily changes; apply a small capped headline-polarity heuristic; render three same-scale pixel meters, Why summaries, links, update times, and uncertainty copy.
  Verify (mechanical): Run `npm run build`; use sample targets below and above the current rate and confirm all three cards show finite computed percentages and update when the target changes.
  Learner check: Enter a target, compare the three cards, change the target, and tell me whether the chance meters and “Why?” explanation are understandable.
  Commit: `Add target likelihood forecasts`

- [ ] **3. Create a room and buzz the travel party**
  Becomes usable: Two connected browsers can create/join a six-digit room, move avatars between synchronized Seoul Night Watch and Common Room areas, see a shared target, and receive visible, audible Test Alerts and target-crossing alerts, plus browser notifications when permission is granted.
  Why now: This proves the unique kernel—one rate moment shared by the party—before the Bi-Monthly history controls and the more involved group vote.
  PRD ref: `prd.md > Party Rooms and Avatars`, `prd.md > Target and Alerts`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Party room and avatars`, `spec.md > Personal target and alert controller`, `spec.md > Data Model`, `spec.md > External Services and Dependencies` (Firebase Spark)
  Build: Add Firebase anonymous sign-in, security rules, room create/join and missing-room prompt, synchronized room locations and avatar scene, shared master target, Test Alert and target-crossing events, browser notification permission, alert sound, and connected-tab repeat timer. Notifications require the page to remain open and connected.
  Verify (mechanical): Run `npm run build`; with Firebase configured, create a room in one browser and join in another, switch locations and confirm both scenes update, then send a Test Alert and confirm both clients show it and play a sound; confirm browser notifications after granting permission.
  Learner check: Open two browser windows, create and join a room, move between Seoul Night Watch and Common Room, try an unknown code, change the shared target as master, enable browser alerts, and press Test Alert. Confirm both windows show the shared location and alert; note the sound and browser notification.
  Commit: `Add shared rooms and synchronized alerts`

- [ ] **4. Add the Bi-Monthly Rate Surveillance tab**
  Becomes usable: The Rate Surveillance section has a default 14-day chart and a Bi-Monthly tab for completed two-month periods labeled across 2022–2026, with each period’s daily rates, peak, selected-day details, and clear unavailable/stale states.
  Why now: This adds historical browsing on top of the verified rate service while keeping the defining party alert kernel earlier in the build.
  PRD ref: `prd.md > Bi-Monthly Rate Surveillance`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Bi-Monthly rate-history tab`, `spec.md > Data Model`, `spec.md > Frankfurter daily reference rates`, `spec.md > Important Failure Modes`
  Build: Add 14 Days/Bi-Monthly tabs and a slim selector for completed two-month periods labeled across 2022–2026; fetch and align both Frankfurter series for the selected date range; render a horizontally scrollable period graph with peak/day inspection; cache each period separately and retain the last-known response with Refresh on failure.
  Verify (mechanical): Run `npm run build`; confirm the newest period in October 2026 is Aug–Sep 2026, earlier periods include Jun–Jul and Apr–May, the selector covers years 2022–2026, cross-year labels are clear, the current incomplete period is disabled, and selected data/peak/day details match each full two-month range.
  Learner check: Open Bi-Monthly, compare Aug–Sep with an earlier two-month period, inspect a day and each period’s peak, then tell me what feels confusing or missing.
  Commit: `Add Bi-Monthly rate history tab`

- [ ] **5. Change the room target at the roundtable**
  Becomes usable: Any member can raise a timed target proposal; Follow/Fold/Hold votes resolve as agreed, including timeout, tie, extension/close, and all-Hold revote behavior.
  Why now: The room and shared target already work, so the final group decision can use real member identities and synchronized room updates.
  PRD ref: `prd.md > Roundtable Target Changes`, `prd.md > Party Room`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Roundtable`, `spec.md > Data Model`, `spec.md > Important Failure Modes`
  Build: Add proposal creation and duration, member cards/votes, deadline display, one-time resolution, tie controls, and revote prompt for all-Hold.
  Verify (mechanical): Run `npm run build`; use two connected members to resolve Follow-majority, Fold-majority, tie close/extend, and all-Hold cases without duplicate resolution.
  Learner check: Raise a short roundtable with a second browser; try one outcome and confirm the target/table result is the one you expect.
  Commit: `Add timed target roundtable`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after Slice 1, before forecasts and party-room polish
- [ ] Final kick-the-tires exploration and feedback completed — after all slices

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: Static reference map prepared from ForecastCards → estimateForecast → forecast-grid. The forecast/news failure and history-only fallback provide a concrete example for the wrap-up. An interactive tour is not claimed; the learner's supplied reflection is recorded below.
Route and stops: reference-only route in devpost/app-map.html: src/components/ForecastCards.tsx (forecast-target), src/lib/forecast.ts (estimateForecast), ForecastCards.tsx (forecast-grid).
Edit outcome: No optional learner code edit in this wrap-up; previous user-directed UI revisions are documented below.
Reflection: Learner supplied their own inspiration and learning reflection; exact words retained only in the ignored learner profile. No public narrative generated.
Activity mode: Static reference and project-grounded recap prepared; not an interactive code tour.

## Revisions

- First-dashboard feedback added a Bi-Monthly tab inside Rate Surveillance, covering completed two-month periods labeled across 2022–2026. Follow-up feedback keeps all available headline languages, compact side-by-side refresh/theme controls, short DARK/LIGHT labels, and non-interactive banknotes that flow naturally. The notes retain their colors in light mode and the Bi-Monthly selector is slimmer with a horizontally scrollable daily chart. The free services and app architecture stay the same.
- Signal Room revision requested: make Seoul Night Watch and Common Room selectable, synchronized avatar locations, and add sound plus optional browser notifications to Test Alert. Browser notifications work while the page is open and connected; push delivery after closing the app remains deferred because it needs background messaging infrastructure.
- Light-theme feedback requested that traveler avatars keep their original color and contrast. Avatar emoji glyphs now counteract the app-wide light-theme inversion.
- Learner review found no September 2026 headlines, so the previous-month tab/archive was removed. The first version now fetches and displays current-month headlines only.

- Early checkpoint approved by the learner: remove the empty September tab and proceed. Current-month news requests now end at the current time rather than a future month-end. Existing room/history work predates the first saved build checkpoint; its verification remains separate.

- Resume progress: current-month headlines and forecast cards compile (`npm run build`). Preview shows the October-only list, three calendar-window cards, and honest cached-news status. GDELT refresh still reports a network failure; removing an archive tab does not fix provider availability. Forecast runtime target comparisons and full room verification remain pending. No slice is marked fully verified on compilation evidence alone.

- Roundtable build added: proposal duration, synchronized Follow/Fold/optional Hold cards, countdown using server offset, majority results, proposer tie extension/closure, and per-member all-Hold re-vote preferences. Shared target changes now use the table; the initial target is still chosen on room creation.
- Security implementation keeps finalization with the existing room-master authority. Ballots are separate, member-owned records with server-enforced deadlines; finalization waits if the master is offline. Updated database.rules.json must be published before roundtable use. Production build passes; no multi-client or security-rule runtime tests were run in this turn. Slice 5 stays unchecked until those checks pass.

- Forecast clarification: restrict inputs to the trailing year, expose the observed date range and successful-path counts, retain the unrounded simulation fraction, and display small nonzero probabilities as <1%. Added the probability formula and independence/market-change assumptions. Production build passes; predictive calibration remains unmeasured.

- Forecast evaluation follow-up: saved a reproducible 2022–2026 rate snapshot and 393 correlated walk-forward cases in `validation/forecast-backtest.md` and JSON. Results underestimate target hits across all three horizons; historical-frequency baseline performs better for this-month and next-month cases. No news adjustment was evaluated. Weekend observations versus weekday simulation steps remain a model/data issue for a separately evaluated revision. Focused forecast checks pass for determinism, date boundaries, input cutoffs, target monotonicity, fractions and zero/all-hit cases; this does not complete the full forecast slice or establish reliable probabilities.
- Parallel MiroFish research produced an official-service distinction, setup requirements, reusable prompt/evaluation protocol and a dated rehearsal packet. No external simulation, paid account, upload or training was performed. A configured LLM and Zep service are still required for an actual official MiroFish run. Historical LLM leakage and missing archived source versions limit the rehearsal to qualitative workflow practice.

- Calendar correction: the downloaded blended rate history has changing weekend observations. Forecast paths now advance every calendar day using returns ending on the matching weekday, excluding missing-date intervals and requiring eight samples per day-of-week pool. The original report remains unchanged; `validation/forecast-calendar-v2.md` compares the same 393 cases. Brier error improved in all three horizons, but aggregate underestimation remains and this is reused development data. Focused calendar checks and production build pass; Vite still reports the existing large-bundle advisory. MiroFish credentials/setup and independent prospective evaluation remain pending.

- Forecast presentation feedback: removed all three “Why?” headings and moved shared daily-change statistics, news explanation and source links into “How these estimates work.” Cards retain their estimates, meters and rate/news timestamps. Removed Refresh Inputs; the top-level Refresh now retries history after any completed feed refresh, including a failed rate request. MiroFish remains preparation only; no connected runner or generated prediction exists.

- Signal Room simplification requested: removed Seoul Night Watch and Common Room location controls and the “Choose a location” caption. All member avatars now share one wrapping scene, regardless of their previously saved location. Existing room records remain compatible; no Firebase data migration is needed.

- Rate discrepancy follow-up: learner reported Apple 328.39 at 18:29 MYT and Google 328.69 at 11:03 UTC (19:03 MYT), versus app 327.91 daily reference. These are different sources/timestamps, not interchangeable quotes. Replaced attempt-time “Data checked” with the successful snapshot fetch timestamp and date; explicitly mark saved/unverified/failed rate data, split rate/news errors, and prevent footer “Sources ready” after either feed fails. Added daily-source disclosure beside the main rate. Intraday provider adoption remains pending verified MYR/KRW coverage, credentials and public-display access.

- Twelve Data follow-up: prepared an optional server-only MYR/KRW adapter, five-minute per-process request cache, visible-page polling, provider timestamp/attribution, and main-ticket/room integration. Configured stale/failed quotes pause automatic crossing alerts; daily history and forecasts stay on Frankfurter. With no key the app retains daily-reference mode. `npm run build` passes (existing large-bundle advisory); no runtime/provider or multi-client tests run. Activation needs the learner's local API key and confirmed pair entitlement. Public deployment additionally needs a backend route and display rights. Existing slices remain unchecked pending their full verification.

- Five-year request implemented: separate Frankfurter/Twelve Data source buttons, a five-year history cache key and estimator lookback option, completed daily-close history through a server-only cached route, and source-specific weekend handling. A provider access request returned 1,420 daily bars from 11 October 2021 through 6 October 2026 for the requested range, confirming account history access. UI reports actual usable coverage after exclusions. Build passes; five-year backtesting and browser/multi-client checks were not run, and no predictive-accuracy claim is made. Existing one-year evaluation defaults remain intact.

- Requested five-year backtest added with fixed monthly origins, 1/3/5% targets, conservative publication lag, complete outcome coverage, three baselines, calibration/discrimination scores, and clustered moving-block bootstrap uncertainty (6/12-month sensitivity). Historical news is excluded for lack of a vintage archive. Five-year calendar/leakage checks and existing forecast checks pass. Raw provider snapshots stay ignored; the reproducible script and findings are in `validation/forecast-five-year.md`. No recalibration or predictive-accuracy guarantee was introduced.
- Follow-up feedback changes the main quote to “Latest market rate,” explains its difference from the selected daily reference chart, and slows browser polling/server quote caching to 30 minutes. Quote freshness/alert continuity tolerance is now 60 minutes so normal polling intervals do not immediately become stale; failed refreshes still pause automatic market-rate alerts. Historical-data caching remains six hours.

- Email notifications requested; learner chose no billing account. Added private opt-in/verification/stop-email UI and wired room test alerts to an optional authenticated email endpoint. Prepared Workers Free/D1/Brevo Free backend, half-hour scheduled crossing checks, unsubscribe links, atomic duplicate claims, demo caps, and room-deletion cleanup. Firebase Spark remains unchanged. Frontend build and Worker syntax pass; no emails, deployment, paid resources, or live backend tests were run. Activation and delivery/security runtime verification remain pending free-account/sender setup described in `email-worker/README.md`.

- Learner requested immediate replacement of GDELT. Switched to fixed publisher RSS endpoints (Malay Mail Malaysia; CNA Business/World), separate local/international lists, server cache, source update times and per-source saved-report fallback. Rolling feeds are labelled honestly rather than a full month archive. Existing forecast fix permits history-only estimates when news is unavailable. Email activation is deferred at the learner's request. Publisher feed access was inspected; no browser interaction tests were run for this change.

- Follow-up adds an English South Korea section from The Korea Times official South Korea RSS feed. Publisher returned 11 readable reports during integration research; Malay Mail domestic feed returned 50. These are source-access observations, not browser interaction tests.

- News retention updated at learner request: last 72 hours, newest 30 per section (90 total); prune stored and displayed reports, retire obsolete GDELT caches, and filter International to publisher Business plus World-title matches for business, war, trade fairs and aviation. Reloads retain the existing 30-minute cache behavior. Build passes; no browser/runtime tests were requested or run.

- Learner confirmed forecast target changes function. News now uses today and the previous two calendar days in MYT, capped at 30 per section; South Korean coverage combines Korea Times domestic, economy and business RSS, deduplicated by URL. RSS cannot backfill reports no longer supplied; no padding or older-than-window articles are added. Added Shared Target refresh/read status. Completed accepted-and-applied, rejected and closed tables disappear from the UI, leaving Propose New Target; unresolved ties/all-Hold remain actionable. Firebase round records are retained. Build passes; no new runtime tests were run.

- Shipping-preparation request: learner confirms Shared Target refresh and two-person Signal Room use work, after previously confirming forecast target changes. Record these as user reports, not exhaustive tests. Reviewed official hackathon requirements; no Git remote or project license found. Prepared submission field guide, app map, and unedited dashboard/forecast screenshots. No public deployment, repository creation, upload or submission performed. Formal build completion remains open for remaining verification and final sign-off.

- Learner supplied their own public repository, https://github.com/mansonmyr/ringgitwon. Unauthenticated GitHub API access confirmed public visibility and only README.md / LICENSE present. Remote LICENSE is PolyForm Noncommercial 1.0.0 (GitHub: Other / NOASSERTION); license choice needs resolving against the open-source requirement. No remote license or code was changed. A limited scan of 163 existing Git history blobs found no configured Twelve Data key, standard private-key headers, GitHub-token patterns or AWS-access-key patterns; the learner profile is neither tracked nor in history. This is not a comprehensive publication audit. Production build passed (bundle-size advisory only); no new runtime tests were run.
