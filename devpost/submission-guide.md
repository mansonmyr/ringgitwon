# RinggitWon — Devpost submission draft

Prepared 9 October 2026 at the creator's explicit request, using their shared inspiration, decisions and the implemented project. Review the first-person statements before submitting. Copy only the text within each field; the preparation notes at the end are not submission answers. No submission has been posted.

## Elevator Pitch

Plan your South Korea trip together: watch MYR–KRW rates, explore target estimates, and coordinate exchange decisions with friends in a shared Signal Room.

## About Project

### Inspiration

The idea for RinggitWon started when I decided to travel with a friend. Keeping track of exchange rates sounds like a small task, but it is easy to forget while planning everything else. I was also worried that the rate might drop unexpectedly before we exchanged our money.

I wanted one place where we could watch the Malaysian ringgit against the South Korean won, set a rate we would be comfortable with, and coordinate our decision together.

### What it does

RinggitWon is a travel-focused MYR–KRW dashboard with a playful heist-inspired interface. It brings together:

- A recent market quote from Twelve Data, with its source and timestamp, alongside Frankfurter's daily reference-rate history.
- A two-week chart and selectable completed two-month periods for exploring earlier rates and peaks.
- Experimental target estimates for this month, next month, and the next three full calendar months, using available history from the past five years.
- A shared Signal Room where travelers join with a six-digit code, see a common target, and send a “right now!” Test Alert to connected members.
- A timed target roundtable where the group can vote Follow, Fold, or Hold on a proposed target change.
- Recent headlines from Malaysia, English-language South Korean reporting, and international business, war, trade-fair and aviation coverage.

The forecast percentages describe simulated outcomes, not guaranteed predictions. Market quotes can differ from daily reference rates and from the rate offered by a money changer. Browser alerts require the page to remain open and connected.

### How I built it

I worked with Codex and the Devpost Learn Skill Pack to turn the idea into a proof of concept. The process used a scope document, product requirements, a technical specification, and a build checklist to organize decisions and implementation.

The frontend uses React, TypeScript and Vite. Firebase Anonymous Authentication and Realtime Database support shared rooms, traveler presence, targets, alerts and voting. Twelve Data supplies market quotes and a separate daily-history source; Frankfurter supplies reference rates and historical data. Server-side routes keep the Twelve Data key out of the browser. Publisher RSS feeds supply headline links.

For the estimates, the app samples historical daily changes to generate 2,000 possible paths. Each percentage is the fraction that reaches the target during the selected window. The two providers run separate simulations. This is a historical simulation, not a trained machine-learning model.

### Challenges I ran into

One challenge was understanding why the app's rate did not match Google Finance or Apple Stocks. Comparing sources and timestamps helped distinguish a recent market quote from a daily reference rate. The interface now explains that difference and checks the market quote every 30 minutes while the page is visible.

Another challenge was news reliability. GDELT failures and rate limits interrupted headlines, so the project moved to publisher RSS feeds. News now covers today and the previous two days in Malaysia time, with up to 30 headlines per section. Historical forecasts can continue without a news adjustment when headlines are unavailable.

Forecasting also required checking the assumptions behind the percentages. Historical backtests did not establish reliable, calibrated real-world probabilities, so the estimates remain clearly experimental. Shared-room synchronization and timed voting added another layer of behavior to check across two clients.

### Accomplishments that I'm proud of

I turned a concern from planning a trip into a working app I could try and improve. I was able to change forecast targets, use the room refresh control, and confirm that two people could use a Signal Room together. Giving feedback on the actual screens helped shape the project throughout the build.

### What I learned

I found the whole process useful, although I am still building hands-on confidence with the tools. Working through planning documents, trying the app, and describing what felt wrong helped me participate in decisions even without much coding experience.

The project also showed why source dates, failed requests and testing assumptions matter. A displayed number needs context, and a simulation that runs successfully still needs evidence before it can be treated as an accurate prediction.

### What's next for RinggitWon

The next steps are to finish the final proof-of-concept review, publish the application code with a suitable open-source license, and prepare the demo. For a public hosted version, the rate and news endpoints also need a production backend.

Later improvements could include activating the prepared email-notification service, strengthening room security and reliability, and evaluating the forecasts against new observations. Email delivery is not connected in the current version.

## Built with

React, TypeScript, JavaScript, Vite, Node.js, Firebase, Firebase Realtime Database, Firebase Authentication, HTML5, CSS3, SVG, Web Audio API, RSS, Frankfurter, Twelve Data, Git, Codex, Devpost Learn Skill Pack

## Try it out links

Repository: https://github.com/mansonmyr/ringgitwon

**Preparation note:** The repository is public but currently contains only README.md and LICENSE. Upload the application and safe planning documents before submitting. A local `127.0.0.1` URL is not a public demo link. Add a live URL only after deployment works.

## Project Media

Upload actual screenshots:

1. [Rate dashboard](media/dashboard.jpg)
2. [Target forecasts](media/forecasts.jpg)
3. [Two-person Signal Room](media/signal-room.jpg), using demonstration names.

## Video Demo Link

Pending: paste your publicly accessible YouTube or Vimeo demo URL after recording.

Suggested shots, in your own narration:

- 0:00–0:25: dashboard, quote timestamp, daily history.
- 0:25–0:50: change a personal target and show the three estimates.
- 0:50–1:50: create/join a room in two clients, propose a target, vote and show the outcome.
- 1:50–2:15: Test Alert and its visible indication/sound.
- 2:15–2:40: headlines and the planning documents.

## URL to your open-source license

https://github.com/mansonmyr/ringgitwon/blob/main/LICENSE

**Preparation note:** This URL currently contains PolyForm Noncommercial, which does not satisfy the standard open-source definition because it restricts commercial use. A replacement license has not been approved or applied. Confirm the license choice and GitHub detection before submitting this field. The proposed MIT text retains the existing copyright name, Kai Hong Ooi. Third-party content retains its own rights.

## Explain how your project meets the main technology requirement

I used the Devpost Learn Skill Pack with Codex to develop RinggitWon through planning and iterative implementation. The project includes a scope document (`devpost/scope.md`), product requirements (`devpost/prd.md`), a technical specification (`devpost/spec.md`), and a build checklist (`devpost/checklist.md`). These documents describe the audience, core journey, behavior, implementation choices and revisions.

Flipped interaction helped me make decisions instead of starting with a fully specified technical solution. For example, the agent asked whether email delivery could require a billing account, and I chose a no-billing setup. It also asked about the news window and article limit; I chose a three-day window and later increased the limit to 30 per section. Those answers shaped the implementation.

I tried the app and gave feedback on actual screens, including the forecast layout, room controls and news availability. The plan and implementation evolved with that feedback. I also confirmed that changing forecast targets and using a two-person Signal Room worked. The planning documents and app map preserve the process and make it easier to understand where future changes belong.

## Preparation checklist — do not paste into a submission field

- Finish `5-build` verification and the creator's final review; do not claim the stage is complete early.
- Review this draft for personal accuracy; the exit survey remains the creator's own answers.
- Resolve the license choice, audit publication contents, and upload source code and safe planning documents.
- Record and upload the video; verify access without signing in.
- Add any required age declaration and complete the exit survey.
- Submit only after all required fields and working links are present.

Official references: [hackathon rules](https://learn-ai-basics.devpost.com/rules), [submission field update](https://learn-ai-basics.devpost.com/updates/46821-two-new-questions-on-the-submission-form), [Markdown formatting](https://help.devpost.com/article/193-markdown-tips), [Open Source Definition](https://opensource.org/osd).

The rules specify a demo under three minutes and a public repository with an open-source license and planning documents. Hosted deployment is optional. Deadline: 27 October 2026, 5:00 am MYT (26 October, 5:00 pm EDT).
