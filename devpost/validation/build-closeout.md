# Build closeout evidence

Recorded 10 October 2026 (MYT), from the 9–10 October resumed build review. Application baseline: 7901093. These are proof-of-concept checks, not production certification.

## Commands

- `npm run build`: passed TypeScript and Vite production compilation. Existing advisory: JavaScript bundle exceeds 500 kB.
- `npm run check:forecast`: passed determinism, monotonicity, fractions, calendar windows, history cutoffs, missing-day handling, five-year lookback and weekday behavior.
- `npm run check:build`: passed vote outcomes, proposal bounds, accepted/applied gating, MYT news date boundaries, topic filtering, deduplication, 30-per-section cap, failed-request saved-cache retention, crossing guards and duplicate suppression. Firebase calls in these deterministic checks are mocked.

## Observed browser checks

| Area | Observed result |
| --- | --- |
| Dashboard | Twelve Data market quote and Frankfurter daily observation displayed with distinct timestamps and explanatory text. |
| Day inspection | Chart click selected 03 Oct 2026, 331.406 KRW/RM1; period peak remained 333.792 on 26 Sept. |
| Theme | Switched light then dark; controls and page remained available. |
| News | Malaysia 30, English South Korea 17, international 30; publisher timestamps, three-day window and limit explanation visible. Counts vary with the feeds. |
| History | Default 14 Days; latest completed Aug–Sep 2026 first, earlier and cross-year choices back to Feb–Mar 2022. No current incomplete period. |
| History selection | Aug–Sep endpoint 332.094 / 30 Sept and peak 351.873 / 2 Aug; Jun–Jul endpoint 351.721 / 31 July and peak 382.844 / 7 June. |
| Frankfurter forecasts | Target 310 yielded 100% in each simulated window. Target 340 yielded <1%, 5.9%, 24.7%. |
| Twelve Data forecasts | Target 340 yielded 15.9%, 34.5%, 54.8%, with separate source/date/count labels. |
| Two-client room | Distinct origins (127.0.0.1 and localhost) joined one test room as master and crew; both displayed two travelers. |
| Follow majority | One Follow plus one non-response accepted proposal 351, updating target from 350 to 351 on both clients. Completed table disappeared. |
| Fold majority | One Fold plus one non-response rejected proposal 352; target stayed 351 and table disappeared. |
| Tie | One Follow / one Fold produced tie controls. Extension reopened voting; after another tied deadline, Close preserved target and hid the table. |
| All Hold | No votes produced the all-Hold prompt. Crew's Yes, Re-vote appeared as one request on the master. Close preserved target. |
| Test Alert | Master alert appeared on crew client with sender and TEST ALERT label. |
| Missing room | Code 000000 returned the agreed no-room/create-room prompt. |
| Console | No warnings/errors in the inspected master tab log. |

Test room 287569 was created for these checks using QA Master / QA Traveler. Its records were not deleted. [Room screenshot](../media/signal-room.jpg) contains demonstration names. Temporary browser tabs may close on interruption; no automatic session-resume claim is made.

## Creator-reported checks

The creator previously confirmed changing forecast targets, the shared-target refresh and two-person room operation. In this review they answered **yes** when asked whether Test Alert appeared and played a sound on both devices and whether enabled browser notifications appeared. These are creator observations, not agent audio/system-notification measurements.

## Limits and remaining review

- No natural market crossing or 90-minute repeat was observed live; crossing guards were checked deterministically.
- No exhaustive Firebase security-rule, adversarial, concurrent-resolution, offline or quota testing. The existing trusted room-master limitation remains documented.
- Browser cache-failure handling is covered by deterministic tests; a complete offline browser journey was not exercised.
- Forecast checks verify implementation behavior, not predictive accuracy. Retrospective backtest limitations remain in the separate reports.
- Email delivery remains inactive. Public hosting, license resolution and repository publication are shipping work.
- The creator's final whole-app review / readiness confirmation is still required before closing 5-build.

## Learning wrap-up

An evidence-based recap connects the already-tried target input to ForecastCards, estimateForecast and the displayed grid. The app map is a static reference, not a claimed interactive learner tour. A reusable lesson is separating computation checks from predictive evaluation, and allowing optional-news failure to fall back honestly to rate history. The creator's personal reflection remains private except the thoughts they explicitly asked to phrase in the submission draft.
