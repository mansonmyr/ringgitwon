---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

The criteria below reconcile approved preview changes on 10 October 2026. Earlier plans remain in Git history and the revisions below. Verification is proportional to this proof of concept; detailed evidence and limits are in `validation/build-closeout.md`.

- [x] **1. Open the rate dashboard and publisher headlines**
  Becomes usable: Market quote, daily chart/peak/day inspection, source timestamps, theme switch and bounded publisher headlines.
  Why now: Proves source access and the first usable screen.
  PRD ref: `prd.md > Rate Dashboard and Graph`, `Forecast Cards and News`, `Currency visuals and cursor`
  Spec ref: `spec.md > Rate data service and dashboard`, `News banner and forecast engine`, `Currency cursor and banknote background`
  Build: Retain Twelve Data market quote, Frankfurter history, non-interactive banknotes and theme controls. Replace GDELT with Malaysia, English South Korea and international RSS sections, today plus two previous MYT days, up to 30 each.
  Verify (mechanical): Production build passes. Browser displayed sourced rates, selected-day readout, peak and publisher sections; theme toggled both ways. Deterministic checks cover news dates, deduplication, topic/count limits and saved-cache retention on failed fetch. No browser warnings/errors observed in the inspected tab. Full network-outage and provider-availability guarantees are not claimed.
  Learner check: Prior dashboard/appearance feedback is recorded below; final whole-app review remains open.
  Commit: `Replace headline feeds and prepare submission handoff` (7901093); closeout verification saved with this checklist.

- [x] **2. Set a target and compare working forecasts**
  Becomes usable: Personal target and three experimental estimates using separate five-year provider histories.
  Why now: Builds on the rate inputs before shared decisions.
  PRD ref: `prd.md > Forecast Cards and News`, `Target and Alerts`
  Spec ref: `spec.md > News banner and forecast engine`, `Five-year simulation revision (9 October 2026)`
  Build: Preserve local target storage, separate source selection, 2,000 historical paths, three calendar windows, source dates and one shared explanation. Missing news permits history-only estimates.
  Verify (mechanical): `npm run check:forecast` passes. Browser target 310 produced 100% in all Frankfurter windows; target 340 produced lower finite estimates. Twelve Data selection produced separate estimates. Historical backtests remain documented, with no calibrated-accuracy claim.
  Learner check: Creator explicitly confirmed forecast target changes work.
  Commit: Existing forecast checkpoints through 7901093; closeout verification saved with this checklist.

- [x] **3. Create a room and buzz the travel party**
  Becomes usable: Two clients share a room, target, avatar scene and Test Alert; refresh reads the shared target.
  Why now: Proves the shared-alert kernel before voting refinements.
  PRD ref: `prd.md > Party Rooms and Avatars`, `Target and Alerts`
  Spec ref: `spec.md > Party room and avatars`, `Personal target and alert controller`
  Build: Retain Firebase anonymous identities, six-digit rooms, shared avatars, presence, alerts and right-aligned refresh. Location controls stay removed. Email remains inactive.
  Verify (mechanical): Two different origins joined the same room as master/member; both showed two travelers and the same target. Test Alert appeared on the second client. Unknown code 000000 displayed the create-room prompt. Deterministic mocked checks cover target-crossing guards and duplicate suppression. Actual natural market crossing and 90-minute repeat timing were not observed in this session.
  Learner check: Creator confirmed two-person operation, refresh, Test Alert sound on both devices and enabled browser notifications.
  Commit: Existing room checkpoints through 7901093; closeout verification saved with this checklist.

- [x] **4. Browse completed Bi-Monthly history**
  Becomes usable: Completed two-month history selection with peak, dates and a wide scrollable chart.
  Why now: Extends the working daily chart.
  PRD ref: `prd.md > Bi-Monthly Rate Surveillance`
  Spec ref: `spec.md > Bi-Monthly rate-history tab`
  Build: Retain 14 Days default, compact period selector, completed pairs and dated chart values.
  Verify (mechanical): Browser defaulted to 14 Days. Selector listed Aug–Sep 2026 first, earlier periods back to Feb–Mar 2022, and cross-year labels; no incomplete/future period. Aug–Sep and Jun–Jul switched to distinct observed endpoints and peaks. Chart day inspection returned 03 Oct 2026 / 331.406 in the daily view. Full provider history completeness is not claimed.
  Learner check: Prior graph/selector feedback is incorporated; final whole-app review remains open.
  Commit: Existing history implementation; closeout verification saved with this checklist.

- [x] **5. Change the room target at the roundtable**
  Becomes usable: Follow/Fold/Hold decisions synchronize and completed tables disappear.
  Why now: Uses the verified shared room and member identities.
  PRD ref: `prd.md > Roundtable Target Changes`, `Current build acceptance amendments — 9 October 2026`
  Spec ref: `spec.md > Roundtable`
  Build: Preserve timed proposals, trusted room-master finalization, tie extension/closure, all-Hold revote choices and finished-table dismissal.
  Verify (mechanical): Live two-client checks passed Follow acceptance (350 → 351), Fold rejection (351 retained), tie extension and closure, all-Hold timeout and synchronized revote choice. Finished tables left Propose New Target on both clients. `npm run check:build` covers pure vote outcomes, proposal bounds and accepted/applied gating. Not a security audit of Firebase rules or exhaustive race test.
  Learner check: Creator's general two-person confirmation is recorded; final review of this completed behavior remains open.
  Commit: Existing roundtable implementation through 7901093; closeout verification saved with this checklist.

## Hands-on Checkpoints

- [x] Early usable behavior explored — prior dashboard feedback
- [ ] Final kick-the-tires exploration and feedback completed — current build ready for creator review

## Final Review

- [ ] Final review complete — creator confirms the current proof of concept is ready to ship

Remaining action: creator reviews the current app and reports any issue or confirms ready. Existing forecast, refresh, two-person room, sound and notification confirmations are retained; do not repeat those questions. No new feature is required for this review. Shipping/publication/license/video are separate.

## Code Tour and App Map

- [x] Learning activity complete — brief evidence-based recap of existing target testing and news-failure fix
- [x] Optional edit and transfer reflection addressed — optional later label edit offered; no edit performed; existing personal reflection retained privately
- [x] `devpost/app-map.html` generated from code, paths checked and opened, including a reusable practice

Activity and evidence: Recap connects the creator's target tests to ForecastCards → estimateForecast → forecast-grid. Tests show the computed outputs respond to changed targets; they do not establish real-world predictive accuracy. The unavailable-news fix shows why an optional input should not disable a usable history-only result.
Route and stops: reference route, not a claimed hands-on tour: src/components/ForecastCards.tsx (forecast-target), src/lib/forecast.ts (estimateForecast), ForecastCards.tsx (forecast-grid).
Edit outcome: No extra learner code exercise required. An optional label edit can be tried later; none performed here.
Reflection: The creator's inspiration and learning reflection are retained in the ignored profile. At their explicit later request, the submission draft phrases their shared thoughts and verified project facts for their review.
Activity mode: Evidence-based recap and static app map, not an interactive code tour.

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

- Build closeout resumed at creator request. Reconciled obsolete GDELT/monthly-news and room-location criteria against approved changes; recorded current PoC checks in `validation/build-closeout.md`. Creator confirmed sound and enabled browser notifications on both devices. Prepared requested Devpost prose for creator review. Final readiness sign-off remains pending; no claim of completed 5-build or public submission.
