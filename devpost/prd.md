---
doc: prd
status: approved
---

# MYR→KRW Travel Rate Party — Product Requirements

A small, public web app for Malaysian travelers heading to South Korea to follow the exchange rate, compare an uncertain target forecast, and coordinate with their travel party. This PRD describes the working proof of concept; the requested Bi-Monthly history, current-month multilingual news window, and expanded currency artwork extend the original 2–4 hour target.

Source: `scope.md > The Unique Kernel`, `Who It's For`, and `The POC Boundary`.

## The Core Journey

1. A traveler opens the public app and sees the current rate as KRW per RM1, a two-week rate graph, a broad news banner, and three forecast cards.
2. They inspect the graph: today’s rate is marked with a gently animated pointer; they scroll through the two-week period to inspect other days and see the period’s highest rate.
3. They can switch Rate Surveillance from the default two-week chart to a **Bi-Monthly** tab, choose a completed two-month period labeled across 2022–2026, and inspect its daily rates and peak. In October, the newest complete period is August–September.
4. They browse the current calendar month's scrollable headline list. It includes source headlines in all available languages across finance, policy, conflict, and trade; opening a headline takes them to its original report.
5. They review the three forecast windows—this month, next month, and the next three months—to compare the estimated chance of their target being reached and why the estimate looks that way.
6. They enter a minimum target rate. A solo traveler can change their own target directly. For a shared trip, the room master sets the initial shared target and connected party members can receive a test alert or a live target-reached alert.
7. A traveler creates a room and shares its six-digit room number, or joins by entering a room number. Members’ avatars appear in the room.
8. If a party member wants to change the shared target, they raise a timed roundtable. Members play Follow, Fold, or Hold cards. The outcome updates or keeps the shared target according to the rules below.
9. The proof is visible in a deployed app: real MYR/KRW data and forecast cards, plus a Test Alert that makes the shared party buzz happen on demand. A natural rate crossing can also trigger it.

Source: `scope.md > The Core Loop` and `What "Working" Looks Like`.

## Screens and Layout

### Rate Dashboard

- The rate graph is the first and primary focus.
- It covers a rolling two-week period. The highest rate in that visible period is identified as the peak.
- Today’s current value is marked by a slowly bouncing pointer. Scrolling across the graph reveals the rate for each other day.
- Show the current rate as KRW per RM1 so the traveler can compare the number with their minimum target.
- Include three forecast cards side by side, a broad headline banner, and an entry point to create or join a party room.
- Add a **Bi-Monthly** tab beside the two-week chart to inspect completed two-month rate periods labeled across 2022–2026.

### Bi-Monthly Rate Surveillance

- Keep the existing two-week chart as the default Rate Surveillance tab. Add a **Bi-Monthly** tab in the same section.
- Offer selectable completed two-calendar-month periods labeled across 2022–2026, newest first. In October 2026, the newest period is **Aug–Sep 2026**, followed by **Jun–Jul 2026**, **Apr–May 2026**, and earlier completed pairs. Include both years in a label when its period crosses a year boundary.
- Show daily MYR/KRW reference rates for the selected period, identify its highest observed rate, and let the traveler inspect individual days.
- Keep the period selector compact enough to fit the control row; make the two-month chart horizontally scrollable so all daily observations remain inspectable.
- Keep observation dates visible and explain missing weekend/holiday publications without filling them with invented values.
- **Acceptance criteria**
  - [ ] Rate Surveillance has tabs for **14 Days** and **Bi-Monthly**; 14 Days is selected by default.
  - [ ] The Bi-Monthly selector covers completed two-month periods labeled across 2022–2026, newest first, with labels such as Aug–Sep 2026, Jun–Jul 2026, and Apr–May 2026 when the current month is October 2026.
  - [ ] Selecting a period loads daily MYR/KRW history for both months, its highest observed rate, and day-by-day inspection.
  - [ ] The current incomplete period and future periods cannot be selected.
  - [ ] Missing data is labelled; the app keeps a last-known result with its date and offers Refresh when data is unavailable or stale.

Source: learner feedback after the first dashboard preview.

### Party Room

- Show the six-digit room number, shared target, rate/alert state, and party avatars.
- The room has a cozy, magical-school atmosphere. Avatars may stand, casually walk, or interact with one another.
- Provide two selectable shared areas: **Seoul / Night Watch** and **Common Room**. A traveler can move between them; each connected member sees avatars in their chosen area.
- Provide controls for the room master to set the initial shared target, for connected members to send a Test Alert, and for a member to raise a target-change roundtable.
- A new room alert plays a short sound and displays a browser notification for members who enabled notifications. Keep the in-app alert visible as a fallback. Browser notifications require the site to remain open and connected in this version.

### Roundtable

- Present a proposed target, the person who raised it, the chosen duration, remaining time, party members, and each member’s card choice.
- Each member starts with Follow (agree) and Fold (disagree) cards and can draw/play a third Hold card (abstain/not ready).
- At the end of the set duration, members who have not responded count as Hold. The room master must be connected to finalize and apply the result; otherwise the table shows that it is waiting for the master.

Source: `scope.md > The POC Boundary` and `The Unique Kernel`.

## Look and Feel

- Use a playful, gamified visual language inspired by Codédex, with a pixel-art traveler avatar and selected pixelated details. Gamification is visual only; there are no XP, levels, or reward badges.
- The concept is a hacker watching the currency rate and waiting for the right moment to “heist.” Keep that as a playful visual metaphor for timing an exchange.
- The party room should feel like a magical school common room; the learner referenced Harry Potter as the inspiration. The room’s avatars can have simple idle, walking, and interaction movement in the basic version.
- The rate marker should feel lively through its slow bounce. The forecast chance uses a pixel-art meter.
- Switching between light and dark themes changes the interface colors without changing avatar artwork colors.
- Specific colors and typography have not been established.

Source: `scope.md > Inspiration & Identity` (style established during PRD interview; no exact palette selected).

## Features and Behavior

### Rate Dashboard and Graph

- Display the current MYR/KRW exchange rate as KRW per RM1.
- Show a two-week graph and identify its highest rate as the period peak.
- Mark today’s value with a gently bouncing pointer. Scrolling over another day reveals that day’s value.
- **Acceptance criteria**
  - [ ] The dashboard presents the current value in the agreed quote direction, KRW per RM1.
  - [ ] The graph shows two weeks of values and calls out the highest value in that period.
  - [ ] Today’s value has a visible animated marker; moving/scrolling across the graph reveals a value for the selected day.
  - [ ] If rate data is missing or out of date, the traveler sees a refresh button.

Source: `scope.md > The Core Loop` and `The POC Boundary`.

### Forecast Cards and News

- Show three side-by-side estimates: **This month**, **Next month**, and **Next 3 months**. Use calendar boundaries: “This month” runs from now through the last day of the current calendar month; “Next month” is the following calendar month; the working interpretation of “Next 3 months” is the three full calendar months after the current one.
- Each estimates the chance that the traveler’s target rate will be reached in that window. Use the same visual scale across all three and a pixel-art meter so travelers can compare them at a glance.
- Under each estimate, show a short **Why?** summary with the main market and news factors, links to relevant articles, and the data update time.
- Display an uncertainty note. Do not show a precise predicted date or make the estimate sound guaranteed.
- A broader, scrollable headline list shows current-calendar-month finance, political policy, conflict, and trade news in every language returned by the source; selecting a headline opens its original article.
- If the provider is unavailable, show saved current-month headlines with their original dates and a refresh action; do not invent headlines.
- If news or exchange-rate information is missing or out of date, show a refresh button. If a refresh still fails, keep the last-known rate visible with its update time and state that current data/forecast information is unavailable; do not imply the stale forecast is current.
- **Acceptance criteria**
  - [ ] All three forecast windows appear together and each has a computed chance estimate for the currently set target.
  - [ ] All three estimates use the same scale and show a pixel-art meter.
  - [ ] Each card has a concise Why? summary, relevant article links, and a data-updated time.
  - [ ] The uncertainty note is visible; the interface does not promise a date or guaranteed outcome.
  - [ ] A scrollable list shows returned headlines across languages, covers finance, policy, conflict, and trade, and opens each original report or newspaper article when tapped.
  - [ ] The news panel shows only current-calendar-month headlines and provides a refresh action when its source request fails.
  - [ ] Missing or stale news/rate information exposes a refresh action.
  - [ ] If refresh fails, the last-known rate remains visible with its update time, while the app says current data or forecast information is unavailable.

Source: `scope.md > The POC Boundary` and `What "Working" Looks Like`.

### Target and Alerts

- A target is the minimum KRW-per-RM1 rate the traveler wants. The shared alert is eligible when the live rate reaches or exceeds that value.
- While the live rate remains at or above the active shared target, send connected party members another automatic in-app ping every 1.5 hours. Stop the repeat pings if the rate falls below target.
- A solo traveler can change their own target directly.
- In a party room, changing the shared target requires a roundtable. The room master sets the initial shared target.
- Connected party members receive an in-app buzz when the target is reached. A Test Alert triggers the same visible party alert on demand.
- A new Test Alert or target alert plays a short sound and triggers a browser notification when the member has granted permission; the in-app alert remains available without permission.
- **Acceptance criteria**
  - [ ] A traveler can enter and see a target in KRW per RM1.
  - [ ] A solo target can be changed without a roundtable.
  - [ ] A party target is not changed directly; a target-change request goes through a roundtable.
  - [ ] When live rate reaches or exceeds an active shared target, connected room members see the in-app alert.
  - [ ] While the rate remains at or above target, connected members receive another automatic ping every 1.5 hours; repeats stop when it falls below target.
  - [ ] Test Alert produces a visible buzz/alert for connected room members without waiting for a natural rate crossing.
  - [ ] Test Alert plays a short sound for connected room members and displays a browser notification for members who granted permission.

Source: `scope.md > The Core Loop` and `The POC Boundary`.

### Party Rooms and Avatars

- A traveler can create a room or join one by entering its six-digit room number.
- The creator is automatically the room master and sets the initial shared target.
- Members’ avatars appear in the room and may stand, walk casually, or interact with other avatars.
- The scene has selectable Seoul / Night Watch and Common Room areas. Moving an avatar updates its shared location for connected members.
- If a number does not match a room, show: **“No room found. Do you want to create a new room?”**
- **Acceptance criteria**
  - [ ] Creating a room gives the traveler a six-digit room number and room-master role.
  - [ ] The room master can set the initial shared target.
  - [ ] A traveler can join by entering a six-digit number; joined members’ avatars appear in the room.
  - [ ] A traveler can move between Seoul / Night Watch and Common Room, and room members see the chosen area.
  - [ ] An unknown room number displays the agreed prompt to create a room.

Source: `scope.md > The Core Loop` and `The Unique Kernel`.

### Roundtable Target Changes

- Any party member can raise a roundtable for a proposed shared-target change and set its duration.
- The table uses card choices: Follow means agree, Fold means disagree, and Hold means abstain/not ready.
- Members who have not chosen a card when time runs out count as Hold. Holds do not count toward the decision.
- If Follow votes outnumber Fold votes, change the shared target to the proposed rate. If Fold votes outnumber Follow votes, keep the current target.
- If Follow and Fold tie, the person who raised the roundtable can extend its duration or close it. Closing a tied round leaves the existing target in force; a traveler can raise a new roundtable later.
- If everyone chooses or defaults to Hold, leave the target unchanged and ask each traveler whether they want a re-vote.
- **Acceptance criteria**
  - [ ] A party member can propose a new target and choose a roundtable duration.
  - [ ] Each participant can play Follow or Fold, or draw/play Hold; the round displays the proposed value, remaining time, and choices.
  - [ ] Non-responses become Hold at expiry and Hold votes are excluded from the Follow/Fold comparison.
  - [ ] More Follow than Fold changes the target; more Fold than Follow preserves it.
  - [ ] A tie lets the raiser extend or close; closing preserves the prior target.
  - [ ] All Holds preserve the prior target and prompt each traveler about a re-vote.

Source: `scope.md > The Unique Kernel` and `The Core Loop`.

### Currency visuals and cursor

- Match the pointer in the learner’s snapshot: black arrow fill, bright white outline, and soft cyan glow. Do not draw a bounding box around the cursor.
- Keep the cursor small and use it consistently over every clickable control.
- Fill the page background with actual Ringgit and Won banknote images. Let the notes flow around the page slowly as non-interactive decoration. Keep the banknote artwork's original color in both interface themes.
- Add a header switch that flips between dark and light modes by inverting the interface colors. Save the traveler’s preference on this device.
- Respect reduced-motion settings by stopping the background motion.
- **Acceptance criteria**
  - [ ] The arrow cursor matches the supplied snapshot’s black interior, white outline, and cyan glow.
  - [ ] Actual Ringgit and Won banknote images fill the background and flow behind readable content without being interactive.
  - [ ] The same small cursor appears on links and enabled buttons.
  - [ ] A dark/light switch inverts the interface colors and remembers its selection without recoloring the banknote images.
  - [ ] Reduced-motion preferences suppress the background animation.
  - [ ] The rate card does not show a “REFERENCE ONLY” stamp.

Source: learner feedback after the first dashboard preview.

## States and Boundaries

- **First visit** — Show the dashboard graph, current rate, news banner, and forecast cards. The traveler can set a personal target or create/join a room.
- **Normal dashboard** — Show the rolling two-week graph, current value, three forecast cards, broad news banner, and room entry.
- **Bi-Monthly Rate Surveillance** — Show the selected completed two-month period labeled from 2022–2026, daily rates, period peak, day inspection, and loading/stale/unavailable states.
- **News list** — Show a scrollable set of linked headlines in all available languages for the current calendar month.
- **Normal party room** — Show the room number, room master’s shared target, connected member avatars, selectable Seoul / Night Watch and Common Room areas, target status, Test Alert, and roundtable action. New alerts use an in-app message and sound; browser notifications are shown when permission is granted and the page is open. If the rate remains at or above target, repeat automatic pings every 1.5 hours until it falls below.
- **Unknown room number** — Show “No room found. Do you want to create a new room?”
- **Missing or stale rate/news data** — Show a refresh button. If refresh still fails, keep the last-known rate visible with its update time and say current data/forecast information is unavailable. Do not present stale forecast information as current.
- **Roundtable expired** — Treat missing responses as Hold, then resolve the round according to Follow/Fold counts. If all responses are Hold, leave the target unchanged and ask each traveler about a re-vote.
- **Background or offline member** — Push delivery after the page closes and alerts to offline members are outside this proof of concept; browser notifications work only while the room page is open and connected.
- **Forecast uncertainty** — Always show an uncertainty note; never present an exact date or guaranteed outcome.

## Product Decisions

- The first and only pair is MYR/KRW, displayed as KRW per RM1, with a minimum target rate. This is the learner’s first travel use case.
- The first screen is a graph dashboard showing a two-week period, its peak, today’s current rate, and other daily values on scroll.
- Older rate data is in the Bi-Monthly tab inside Rate Surveillance; it does not replace the default two-week chart. The tab offers completed two-month periods labeled across 2022–2026, with a horizontally scrollable graph for daily inspection.
- The forecast is a working estimate for three windows, shown side by side with the same scale, a pixel meter, a Why? summary, linked articles, update time, and uncertainty note.
- Broad finance, policy, conflict, and trade headlines in all returned languages are shown in a scrollable current-month list; selecting a headline opens its source article.
- The small cursor matches the supplied black-and-white arrow snapshot with cyan glow on clickable controls. Actual Ringgit and Won banknote images flow through the background without interaction; the app has a saved inverse-color dark/light switch that leaves banknote colors unchanged, and the rate card has no “REFERENCE ONLY” stamp.
- A creator is room master, sets the initial shared target, and receives a six-digit room number to share. The specific code-generation behavior is an assumption to confirm in `4-spec`.
- Solo target edits are direct; party target changes use the learner-designed Follow/Fold/Hold roundtable.
- Gamification affects visual style only. The poker-inspired cards are an interaction metaphor for group agreement, not gambling or rewards.
- The learner wants basic working versions of the agreed features and a deployable result where practical; the requested archive and expanded news window extend the original 2–4 hour target.

## What We're Building

- A public web app focused on MYR/KRW.
- A two-week graph with a visible peak, current-rate pointer, and day-by-day inspection.
- A scrollable linked-news list for the current month without a language filter, plus three working, uncertain target-likelihood estimates.
- A Bi-Monthly rate-history tab covering completed two-month periods labeled across 2022–2026.
- Target entry, six-digit party rooms, avatars that move between Seoul Night Watch and Common Room, Test Alert with sound and optional browser notification, live threshold alert for connected members, and the timed roundtable target-change flow.
- A pixel-art heist visual theme and a magical-school-style party room, including simple avatar movement/interactions.
- A smaller snapshot-matched arrow cursor on clickable controls, actual full-page flowing Ringgit/Won banknotes, and a saved inverse-color dark/light switch that preserves banknote colors.

## Deferred From the POC

- Push delivery when the app is closed or a traveler is offline — the first version alerts connected members in-app, with sound and optional browser notifications while the page is open.
- Additional currency pairs and destinations — the proof is focused on one travel route.
- Broader forecast validation and production reliability for a large public audience — the first forecast is clearly uncertain and is not presented as financial advice.

## Possible Later Enhancements

- Add other currencies and travel destinations.
- Add background push alerts after the app closes or for offline travelers.
- Improve forecast validation and product reliability as usage grows.

## Non-Goals

- Guaranteeing that a target will be reached or naming a precise future date — forecasts are uncertain estimates.
- Placing currency exchanges or handling money — the app informs and coordinates travelers; it does not exchange currency.
- XP, levels, or reward badges — the learner chose visual gamification only.
- Monitoring multiple currency pairs in the first proof of concept — one pair keeps the first experience focused.

## Open Questions

- **Resolve in `4-spec`:** Which rate/news data sources and forecast method can support the agreed outputs while making their limits visible?
- **Resolve in `4-spec`:** What update cadence should “live” rate and news data use?
- **Resolve before build:** Are member avatars chosen by travelers or assigned automatically? Their appearance and movement style are set, but selection behavior is not.
- **Not blocking:** The product name, exact color palette, and typography have not been selected; the working title is descriptive.
- **Assumption to confirm in `4-spec`:** Creating a room generates a new six-digit room number that the creator can share.
