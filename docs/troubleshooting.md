# Troubleshooting

Common problems and how to resolve them. If an error is not listed here, check the server
console — MailOS logs Gmail failures with their status and Google's explanation.

- [Setup and install](#setup-and-install)
- [Authentication](#authentication)
- [Gmail](#gmail)
- [AI providers](#ai-providers)
- [Supabase](#supabase)
- [Data and UI](#data-and-ui)

## Setup and install

### `pnpm install` fails on native binaries

Tailwind 4 (`@tailwindcss/oxide`) and `sharp` require Node 20.9+. Check with `node -v` and
upgrade if needed, then delete `node_modules` and reinstall.

### Port 3000 is already in use

Stop the other process, or run `pnpm dev -- --port 3001`. If you change the port, update
`APP_URL` and the Google redirect URI to match (`http://localhost:3001/api/auth/callback`).

### `pnpm build` succeeds but types are broken

`next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so the build does not fail on
type errors. Run `npx tsc --noEmit` to type-check explicitly.

## Authentication

### `?error=google-not-configured`

`GOOGLE_CLIENT_ID` is unset. Add it to `.env` and restart the dev server (env changes
require a restart).

### `?error=token`

The code-to-token exchange failed. Common causes:

- `GOOGLE_CLIENT_SECRET` is wrong or belongs to a different client.
- The authorization code was already used or expired — retry the flow from `/`.
- The redirect URI in the token request does not match the one sent to Google (both derive
  from `APP_URL`; keep them consistent).

### `?error=oauth`

`/api/auth/callback` was reached without a `code` query parameter. Start the flow from the
**Connect Gmail** button rather than hitting the callback directly.

### <a id="redirect_uri_mismatch"></a>`redirect_uri_mismatch` from Google

The `redirect_uri` MailOS sends must be registered exactly. It is built as
`${APP_URL}/api/auth/callback`. Fixes:

- Ensure `APP_URL` matches the origin you are actually visiting (scheme, host, and port —
  `localhost` and `127.0.0.1` are different).
- Add the exact URI under **APIs & Services → Credentials → your OAuth client → Authorized
  redirect URIs**.
- Restart the dev server after changing `APP_URL`.

### Access denied / app not verified

While the consent screen is in **Testing** mode, only accounts added under **Test users** can
authorize the app. Add your Google account there (or publish the app).

### Signed out unexpectedly after signing in

The session cookie lasts 7 days and is `secure` in production. A cookie is not sent over
plain HTTP, so a production build served over HTTP will appear signed out — always use
HTTPS in production.

## Gmail

### "Gmail API is not enabled for this Google Cloud project…"

Enable the Gmail API at
[console.cloud.google.com](https://console.cloud.google.com/apis/library/gmail.googleapis.com),
wait a minute for propagation, then reconnect. This is a `403` surfaced verbatim from
Google.

### "Gmail rejected the access token (401). Reconnect your Google account."

The stored access token is invalid or expired (access tokens last about an hour). Sign out
and reconnect. MailOS does not currently perform refresh-token rotation, so a long-lived
session may need to reconnect.

### "No Gmail access token. Reconnect your Google account."

The session exists but carries no access token — usually an old cookie from before a schema
change. Sign out and reconnect.

### Inbox is empty after processing

- Confirm the Gmail account actually has messages in the **INBOX** label.
- MailOS fetches at most 30 messages per run.
- Check the browser console and server logs for per-message fetch failures (these are logged
  but skipped).
- A cached inbox can mask a failure: delete the `mailos-inbox-v2` `localStorage` key, or
  click **Re-process inbox**.

## AI providers

### Routing looks generic or keyword-based

Missing or invalid `JEV_AGENT_KEY` / `TYPESAFE_API_KEY` makes `classifyEmail()` fall back to
heuristics (confidence is always `0.82` in that mode). Set a valid key and re-process.

### Amounts, dates, or times are wrong

Missing or invalid `GROQ_API_KEY` makes `extractActions()` fall back to regex scanning, which
is less accurate. Set a valid key and re-process.

### Category routing is fuzzy

Jev classifies against each category's **description**. Vague or overlapping descriptions
are the main cause of mis-routing. Rewrite them as the rule the classifier should apply and
re-process from `/settings` using **Save & re-process inbox**.

## Supabase

### Nothing is persisted

`persistInbox()` silently returns `{ persisted: false }` when either
`NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is unset. Set both and restart.

### `relation "emails" does not exist`

Run [`supabase/schema.sql`](../supabase/schema.sql) in the Supabase SQL Editor.

### Writes fail with a permission error

You are likely using the **anon** key, which is subject to Row Level Security. Use the
**service_role** key for `SUPABASE_SERVICE_ROLE_KEY`. See [database.md](database.md#row-level-security).

## Data and UI

### Changes to categories did not take effect

Category edits apply on the next pass. Click **Save & re-process inbox**, or process from the
dashboard.

### Stale inbox after switching Gmail accounts

The inbox is cached in `localStorage`. Sign out, then clear the `mailos-inbox-v2` and
`mailos-categories` keys (or all site data) and reconnect.

### Custom category has no color

Custom categories get a stable color derived from a hash of their name. This is expected —
it is the fallback tone, not a bug.

### Protected route bounces to `/`

`middleware.ts` redirects `/dashboard`, `/actions`, and `/email/:path*` when the session
cookie is absent. Sign in again. If you just signed in and are still redirected, your browser
may be blocking the cookie (third-party cookie settings, or serving over HTTP in production).
