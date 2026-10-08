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

Activity and evidence: [what actually happened; real document/test/code references; unfinished work if interrupted]
Route and stops: [actual paths and symbols; guided stops completed, or reference-only route]
Edit outcome: [tried/kept/reverted/declined/not applicable; verification if changed]
Reflection: [offered/answered/declined/already covered — personal answer belongs only in the ignored profile]
Activity mode: [live app and editor, explicit static fallback, focused alternative, prior practice, or recap]

## Revisions

- First-dashboard feedback added a Bi-Monthly tab inside Rate Surveillance, covering completed two-month periods labeled across 2022–2026. Follow-up feedback keeps all available headline languages, compact side-by-side refresh/theme controls, short DARK/LIGHT labels, and non-interactive banknotes that flow naturally. The notes retain their colors in light mode and the Bi-Monthly selector is slimmer with a horizontally scrollable daily chart. The free services and app architecture stay the same.
- Signal Room revision requested: make Seoul Night Watch and Common Room selectable, synchronized avatar locations, and add sound plus optional browser notifications to Test Alert. Browser notifications work while the page is open and connected; push delivery after closing the app remains deferred because it needs background messaging infrastructure.
- Light-theme feedback requested that traveler avatars keep their original color and contrast. Avatar emoji glyphs now counteract the app-wide light-theme inversion.
- Learner review found no September 2026 headlines, so the previous-month tab/archive was removed. The first version now fetches and displays current-month headlines only.

- Early checkpoint approved by the learner: remove the empty September tab and proceed. Current-month news requests now end at the current time rather than a future month-end. Existing room/history work predates the first saved build checkpoint; its verification remains separate.

- Resume progress: current-month headlines and forecast cards compile (`npm run build`). Preview shows the October-only list, three calendar-window cards, and honest cached-news status. GDELT refresh still reports a network failure; removing an archive tab does not fix provider availability. Forecast runtime target comparisons and full room verification remain pending. No slice is marked fully verified on compilation evidence alone.
