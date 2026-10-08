---
doc: scope
status: approved
---

# MYR→KRW Travel Rate Party

A deployable web app that helps Malaysian travelers and their travel companions watch the MYR/KRW rate, coordinate around a target, and see an uncertain forecast for when that target might be reached.

## The Unique Kernel
It turns a good exchange rate into a shared moment: a traveler sets a target, and their travel party can get the same “right now!” buzz when it arrives. The forecast adds context about whether the group may reach that target this month, next month, or within three months.

## Who It's For
Students and busy office workers in Malaysia planning a South Korean holiday with friends or family. They want to exchange money at a rate they like but may not have time to keep checking it manually.

## The Core Loop
They open the app, follow MYR/KRW, enter a target rate, and check the estimated chance of reaching it in one of three time windows. They create or join a party room; while members are connected, the app alerts the group if the live rate reaches the target, and a traveler can send a manual “right now!” buzz.

## Inspiration & Identity
Use a playful pixel-art heist look inspired by Codédex. Keep the two-week graph as the default Rate Surveillance view and add a separate **Bi-Monthly** tab for selectable completed two-calendar-month periods labeled across 2022–2026. Make the Bi-Monthly graph horizontally scrollable to inspect daily values. Show broad current-calendar-month news headlines in every language returned by the provider; if the feed is unavailable, keep the latest known headlines and offer refresh. Use a small custom cursor matching the learner’s snapshot: black arrow with a bright white outline and soft cyan glow on every clickable control. Fill the background with authentic Ringgit and Won banknote images that flow naturally across the page. Keep their colors unchanged when switching the interface between dark and light modes. Remove the “REFERENCE ONLY” stamp from the rate card.

## Why This Matters to the Learner
The learner wants this to be their first working, small-production-grade app and hopes to deploy it for people to use. Their stated learning goal is “getting the app working.”

## What "Working" Looks Like
A public web link opens to a real MYR/KRW exchange rate. Rate Surveillance defaults to the latest two weeks and offers a Bi-Monthly tab with completed two-month periods labeled across 2022–2026; the current incomplete period is hidden so the latest complete period is shown first (for example, August–September when the current month is October). Travelers can inspect daily values and the peak in each period. A scrollable headline list shows current-month stories in all languages returned by the provider; source dates remain visible and cached headlines appear with a refresh action if the feed is unavailable. A traveler can set a target and see a calculated estimate of whether it may be reached this month, next month, or in the next three months, with contributing factors and uncertainty made visible. They can create or join a party room, move between Seoul Night Watch and Common Room, and send a Test Alert that appears in-app, plays a sound, and triggers an optional browser notification for connected members.

## The POC Boundary
- One currency pair: Malaysian ringgit to South Korean won (MYR/KRW).
- A deployable web app with a live exchange-rate feed and one user-set target.
- A Bi-Monthly Rate Surveillance tab with selectable completed two-month periods labeled across 2022–2026 and daily MYR/KRW observations.
- A scrollable linked-news list for the current calendar month, without a language filter.
- A smaller snapshot-matched black arrow cursor on clickable controls; actual Ringgit and Won banknotes flowing naturally through the page without changing color when the interface theme switches; reversible light/dark interface colors.
- A working forecast for the three selected time windows, based on exchange-rate and international-news information. It reports the estimated likelihood of reaching the target and its contributing factors; it does not promise an exact date or a guaranteed result.
- A party room with two synchronized hangouts—Seoul Night Watch and Common Room—where each traveler can move their avatar between areas. Connected members receive in-app alerts, a short sound, and a browser notification when permission is granted, including for Test Alert and target crossings.

## Later
- More currency pairs and destinations.
- Push delivery when the app is closed or a participant is offline; this version's browser notifications require the room page to remain open and connected.
- Greater forecast validation, coverage, and production reliability for a wider public audience.

## Explicitly Cut
- Last-month news tab/archive. During review the September 2026 tab had no results, so the first version shows the current calendar month's news only.
