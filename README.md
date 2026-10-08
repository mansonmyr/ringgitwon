# RinggitWon — MYR / KRW Watch

The app includes a browser dashboard for daily MYR→KRW reference rates and recent international news, plus Firebase-backed Signal Rooms for travelers to share a target and send a synchronized Test Alert. The graph uses published daily observations, so weekends and holidays can leave gaps and the rate is not a live money-changer quote. Headlines show the current calendar month only, with cached stories retained when GDELT is unavailable.

## Run locally

Install dependencies and start the local server:

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. The port is fixed; Vite stops with an error if another process occupies it. The dashboard fetches the latest available observations and headline links when it opens, when Refresh is pressed, and about hourly while the page is visible. It keeps the last successful response in this browser if a refresh fails.

## Enable Signal Rooms

Room syncing uses Firebase Anonymous Authentication and Realtime Database on the no-cost Spark plan. To enable it:

1. Create a Firebase project and add a web app in the [Firebase console](https://console.firebase.google.com/).
2. Copy the web app values into a new `.env.local`, using the names in `.env.example`. The browser config is public; never put a service-account key in this file.
3. Enable **Anonymous** sign-in in Authentication.
4. Create a Realtime Database, copy its database URL into `VITE_FIREBASE_DATABASE_URL`, and apply the rules from `database.rules.json`.
5. Restart `npm run dev`. The Signal Room can then create/join six-digit rooms, show live members, share the room-master target, and sync Test Alerts.

Without those settings, the app explains what is needed and keeps the room actions disabled. Room data is client-synchronized for the demo; do not store personal information in a room.

## Data sources

- [Frankfurter](https://frankfurter.dev/) for daily reference rates and rate history.
- [GDELT DOC](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) for recent headline links.

The chart and forecasts are informational and do not guarantee an exchange outcome. This project does not exchange money.

## Banknote artwork

- `public/ringgit-rm50.jpg` is a resized, optimized copy of the RM50 image from [Bank Negara Malaysia's RM50 page](https://www.bnm.gov.my/currency/banknotes/-/asset_publisher/bUDWhag9otfb/content/currency-banknotes-rm50). The image retains the note's original design and color.
- `public/korean-won-50000.jpg` is the 50,000-won front image from the [Bank of Korea's banknotes page](https://www.bok.or.kr/static/eng/img/cts/old/money_five_img06.jpg). Its visible Korean specimen mark remains in the image.
- Currency reproductions follow the published [Bank Negara Malaysia reproduction guide](https://www.bnm.gov.my/documents/20124/39730/en_reproduction_guide.pdf) and [Bank of Korea reproduction guidelines](https://www.bok.or.kr/eng/main/contents.do?menuNo=400057).

## Experimental forecast

Set a personal target in the Plan section. Three cards use 2,000 simulated paths sampled from approximately one year of observed daily rate changes. They compare this calendar month, next month, and the next three full calendar months in Kuala Lumpur time. The method disclosure explains the small, fading English-headline heuristic. Results are unvalidated scenarios, not reliable real-world probabilities. Stale/missing inputs suppress the estimates. Personal targets are saved in browser storage.

## Remaining build work

The timed Follow/Fold/Hold roundtable and final end-to-end review remain unfinished. Browser notifications require an open, connected page; closed-app push and continuous server monitoring are not implemented.
