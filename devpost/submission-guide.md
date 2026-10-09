# RinggitWon — submission preparation

Prepared 9 October 2026. This is a field guide and technical evidence inventory, not ready-to-submit project prose. The learner writes the pitch, story, technology-requirement answer and exit survey. The `6-ship` skill permits factual guidance and spelling/grammar corrections, but asks the agent not to draft or rewrite public answers.

## Stage and links

`6-ship` follows the final review and learning wrap-up in `5-build`. Recorded implementation and learner checks are substantial; some detailed verification and final-review boxes remain open. Do not claim every edge case was tested.

- Public repository: [mansonmyr/ringgitwon](https://github.com/mansonmyr/ringgitwon), supplied by the learner and verified publicly readable through GitHub's unauthenticated API on 9 October 2026. It currently contains only README.md and LICENSE; application code has not been uploaded. This checkout has no Git remote configured yet.
- Live app: local preview only. `http://127.0.0.1:5173` works on the developer's computer, not for judges remotely.
- License: the public repository uses PolyForm Noncommercial 1.0.0; GitHub reports its license as Other / NOASSERTION. No root license exists in this local checkout. A license decision is needed before submitting; see License URL below.
- Video: no uploaded demo URL supplied.
- Screenshots: [dashboard](media/dashboard.jpg), [forecasts](media/forecasts.jpg). These are unedited local-preview captures, not evidence of a public deployment.

The [official rules](https://learn-ai-basics.devpost.com/rules) require a public repository with source, assets, run instructions and an open-source license, plus the Skill Pack planning documents. Record a functioning demo under three minutes and publish it on YouTube or Vimeo. A hosted app is optional for submission. Deadline: 27 October 2026, 5:00 am MYT (26 October, 5:00 pm EDT).

## Elevator Pitch

Write one short sentence in your own words. Include the intended audience, the exchange-planning problem, and the useful outcome. Keep within the character limit shown by the form. Do not promise financial savings or prediction accuracy that has not been measured.

## About Project

Use Markdown headings, with your own text beneath them:

```markdown
## Inspiration

## What it does

## How I built it

## Challenges I ran into

## What I learned

## What's next
```

Questions to answer:

- Inspiration: what personal situation or observation made you want this app?
- What it does: what can a traveler complete from opening the rate dashboard to coordinating a target with their crew?
- Building: how did the scope, PRD, technical spec and build checklist guide implementation?
- Challenges: which real issue was most significant to you? Relevant recorded events include provider failures, quote/reference differences, forecast backtesting, and synchronized room voting.
- Learning: what changed in your own understanding or approach? Do not substitute an agent's assumption about what you learned.
- Next: which improvement matters most to you after this proof of concept?

[Devpost formatting guide](https://help.devpost.com/article/193-markdown-tips): Markdown headings, lists and links are supported. LaTeX is optional, not required. The numerical estimate in the code is target-reaching simulated paths divided by 2,000, multiplied by 100; it is not measured prediction accuracy.

## Built with — factual candidates

Choose the matching tags offered by Devpost; there is no need to fill all 25 slots:

React, TypeScript, JavaScript, Vite, Node.js, Firebase, Firebase Realtime Database, Firebase Authentication, HTML5, CSS3, SVG, Web Audio API, RSS, Frankfurter, Twelve Data, Git, Codex, Devpost Learn Skill Pack.

Do not list MiroFish as an implemented model. Cloudflare/D1/Brevo are prepared for optional email delivery but are not connected or deployed.

## Try it out links

Use [https://github.com/mansonmyr/ringgitwon](https://github.com/mansonmyr/ringgitwon) after the source code and planning documents have been uploaded. Add a hosted application URL only after its backend routes work. Keep the video URL in the dedicated video field too. The organizer explicitly requests the public repository in this field: [submission update](https://learn-ai-basics.devpost.com/updates/46821-two-new-questions-on-the-submission-form).

## Project Media

Use the dashboard capture as the first image; the forecast capture shows the three horizons and experimental label. Add a fresh two-person room/roundtable screenshot using demo names and a room intended for public display. Capture actual running UI, without browser-comment markers. No active room was created for the two saved screenshots.

## Video Demo Link

Suggested recording shot order, not a narration script:

| Approximate time | Visible action |
| --- | --- |
| 0:00–0:25 | Dashboard, quote source and timestamp, daily history |
| 0:25–0:50 | Personal target and three simulated horizons |
| 0:50–1:50 | Two browsers: create/join a room, propose, vote, show shared result |
| 1:50–2:15 | Test Alert with visible indication and sound |
| 2:15–2:40 | Headline sections and a brief view of planning documents |

Keep the complete video under three minutes. Use a 15-second vote for the demonstration. Show the room master connected while it resolves. Speak in your own words. Ensure reviewers can access the published video without signing in. No video has been recorded or uploaded yet.

## License URL

Existing license URL: [LICENSE](https://github.com/mansonmyr/ringgitwon/blob/main/LICENSE). It currently contains PolyForm Noncommercial 1.0.0. Its commercial-use restriction is incompatible with the [Open Source Definition](https://opensource.org/osd), so it should not be presented as satisfying the hackathon's open-source requirement.

The [MIT license](https://opensource.org/license/mit) is an open-source option that permits commercial use, modification and redistribution while requiring preservation of its notice. The learner must approve any change. Current public attribution names Kai Hong Ooi. After the chosen complete standard license is committed and uploaded, check GitHub detects it and use the same license URL. No license has been changed by the agent.

Third-party banknote artwork, publisher content, provider data and bundled dependencies retain their own rights. A project license cannot relicense them; preserve notices and review distribution permissions before publishing.

## Main technology requirement — evidence to explain in your own words

| Topic | Project evidence |
| --- | --- |
| Scope and audience decisions | `devpost/scope.md`: audience, unique kernel, proof-of-concept boundary |
| Product behavior | `devpost/prd.md`: core journey, forecast, room and voting behavior |
| Implementation plan | `devpost/spec.md`: React/Firebase stack, data sources, failure handling and revisions |
| Ordered build and feedback | `devpost/checklist.md`: slices and recorded requested changes |
| Flipped interaction | Describe an actual exchange where the agent asked you for a decision and your answer shaped the project. Explain what you decided; do not simply claim the skill files were installed. |
| Iteration example | The no-billing constraint shaped optional email preparation; news-provider failures led to RSS feeds and history-only forecasts. Choose an example you personally want to discuss. |

Include the actual scope, PRD and spec in the public repository. Keep the ignored learner profile and secrets private. Do not claim `6-ship` or submission is complete before completing its remaining steps.

## Accurate feature claims

- Main market quote: Twelve Data, checked roughly every 30 minutes while visible; not tick-by-tick or guaranteed 24/7.
- Rate history: Frankfurter; two-week and completed two-month views.
- Forecast: separate five-year histories, 2,000 sampled paths, three horizons. Backtests did not establish calibrated real-world probabilities. No trained ML or connected MiroFish prediction.
- Signal Room: Firebase anonymous identity, shared target, timed votes and connected-page alerts. Learner reports two-person use works; exhaustive edge-case/security testing is not claimed.
- News: Malaysia, English South Korea and international sections; today plus the two previous MYT calendar days, maximum 30 per section. RSS can return fewer.
- Email: prepared but inactive, intentionally deferred.

## Next technical work

- Reconcile remaining `5-build` verification/final-review records without inventing results.
- Resolve the current noncommercial license versus the hackathon's open-source requirement; preserve the learner's chosen copyright attribution.
- Audit files and history before public publication; no publish action is authorized by this worksheet.
- If hosting is desired, provide `/api/intraday-rate`, `/api/rate-history`, and `/api/news` as production backend routes. Uploading `dist` alone cannot supply them.
- Record/upload the demo and add a two-person room image.
- Complete the learner-written fields, required age checkbox and exit survey, then submit.
