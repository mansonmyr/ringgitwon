# Signal Room email alerts — no billing account

Prepared for Cloudflare Workers **Free**, Cloudflare D1 **Free**, Firebase **Spark**, and Brevo **Free**. Nothing has been deployed or sent. Leave `VITE_EMAIL_API_URL` empty until setup is complete. This is a small hackathon implementation, not a guaranteed delivery service.

## What is implemented

- Existing Firebase anonymous sign-in authenticates API requests. Only an actual room member can subscribe or request a test email.
- Email addresses and verification tokens live in private D1, never in the shared Firebase room. Room participants cannot list each other's emails.
- Subscribers choose target alerts and/or room test alerts, explicitly agree, then confirm an emailed link. Changing address/preferences requires confirmation again.
- Verification expires after 24 hours. Link GET requests display a form; POST confirms/unsubscribes, so ordinary email link scanners cannot activate or delete subscriptions.
- Each alert email includes an unsubscribe link. “Stop emails” deletes the current user's subscription. Email consent continues after leaving/closing the app until unsubscribe; the UI says so explicitly.
- A cron job runs every 30 minutes, obtains one MYR/KRW quote and compares it with the previous fresh quote per room. It sends on a below-to-at-or-above crossing, not on every check above target. Initial startup, changed targets, and gaps over 60 minutes establish a new baseline. Short-lived crossings between checks can be missed.
- Scheduled work continues after the browser closes. It ignores client-created rate alerts and retrieves its own Twelve Data quote. Room test events are checked against Firebase and sent only to test-opted-in subscribers.
- Every check re-reads room existence, identity (`createdAt`), target and membership. Deleted/reused rooms or removed members have subscriptions purged at the next successful check (nominally within 30 minutes). Cleanup precedes quote fetching. Emails already accepted by the provider cannot be recalled.
- Atomic D1 delivery claims suppress duplicate attempts. A crash/timeout after the claim can lose an email; ambiguous deliveries are deliberately not retried automatically. An API acceptance is not confirmation of inbox delivery. `deliveries.status` records `accepted` or `failed-or-unknown` for inspection; retained seven days.

## Accounts needed (free plans only)

1. Create/sign in to a Cloudflare account on Workers Free. Do not enable a paid plan.
2. Create a Brevo Free account and complete any required account/transactional-email activation. Add and verify your sender email in Brevo. Use an API key, not an SMTP key. If using a free mailbox address, follow Brevo's sender restrictions; domain authentication and delivery depend on the sender/provider. Do not buy a domain or upgrade for this setup without a separate decision.
3. Firebase anonymous authentication must stay enabled. The worker creates one dedicated anonymous Firebase identity and stores its refresh token privately in D1. Existing rules allow authenticated reads of individual rooms. No Firebase Admin service-account key or Blaze upgrade is needed. Do not open database rules or grant public read access. Avoid deleting the monitor identity; an invalid refresh token fails closed until repaired.

Official sources: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 Free limits](https://developers.cloudflare.com/d1/platform/pricing/), [Brevo Free limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan), [sender verification](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender), [transactional API](https://developers.brevo.com/docs/send-a-transactional-email).

## Deploy after accounts and sender are ready

Run from this directory using the Cloudflare CLI (`npx wrangler`). Commands below provision services; they have **not** been run by the coding agent.

1. `npx wrangler login`, then `npx wrangler whoami`.
2. `npx wrangler d1 create ringgitwon-email`. Copy the returned database ID into `wrangler.jsonc`.
3. Set `PUBLIC_URL` to your planned Worker URL (for example `https://ringgitwon-email.YOUR-SUBDOMAIN.workers.dev`), `SENDER_EMAIL` to the verified sender, and `APP_ORIGINS` to the exact allowed frontend origin(s), comma-separated. Local preview uses `http://127.0.0.1:5173`. Production must be HTTPS. Confirm `FIREBASE_DATABASE_URL` matches the application.
4. Add worker secrets interactively; never paste them into source control:
   - `npx wrangler secret put FIREBASE_API_KEY` (the same project's web API key)
   - `npx wrangler secret put BREVO_API_KEY`
   - `npx wrangler secret put TWELVE_DATA_API_KEY`
5. `npx wrangler d1 migrations apply ringgitwon-email --remote`.
6. `npx wrangler deploy`. Keep the account on Workers Free; do not add paid resources. Cron propagation may take time.
7. Add `VITE_EMAIL_API_URL=https://YOUR-WORKER-URL` to the app's ignored `.env.local` and restart Vite. This URL is public; provider credentials belong only in Worker secrets. The local Twelve Data key is not automatically copied to the Worker.

## Free-demo limits and delivery boundaries

The app enforces ten total subscriptions, one verification request per user per ten minutes, three per destination per day, one room test-email burst per ten minutes, and at most 90 attempted outbound emails per UTC day. Brevo currently advertises 300 free sends/day, but other account usage counts separately. Expired pending subscriptions are deleted by cron. Free-plan limits reject work rather than guarantee delivery; do not upgrade automatically. Scheduler calls add roughly 48 Twelve Data requests/day beyond the local app's usage.

Confirmed subscriptions persist until unsubscribe or room/member deletion. They are stored in D1 instead of Firebase. Provider logs and Cloudflare backups can have their own retention; deletion here removes active subscriptions, not emails already sent or provider backups. Keep D1 and Worker dashboards private. Account keys and the D1 monitor refresh token must never be committed or logged. IP/API-key restrictions on Firebase or Brevo must permit this backend; do not remove restrictions blindly.

The current authenticated-room-read rules are a demo constraint. If rules later restrict room reads to members, implement a dedicated server reader with appropriate narrowly scoped access before enabling scheduling. The monitor does not write shared room data.

## Verification still required before enabling real recipients

No provider/worker end-to-end tests or live sends have been performed. With your own explicitly authorized test email: verify membership/auth rejection, expired/used links, changing addresses/preferences, unsubscribe, test opt-in and limits, fresh/stale quotes, below/above crossings, room dismissal/reuse, and failure/duplicate handling. Inspect Worker logs, cron execution and private delivery status. Verify that scheduled checks still run after closing all app tabs. Firebase and Brevo account setup and a deployed Worker are prerequisites.
