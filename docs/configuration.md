# Configuration

All configuration is done through environment variables. The template lives in
[`.env.example`](../.env.example); copy it to `.env` for local development.

## Variable reference

| Variable | Required | Used by | Description |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` | **Yes** | `app/api/auth/google/route.ts`, `app/api/auth/callback/route.ts` | OAuth client ID. If missing, `/api/auth/google` redirects to `/?error=google-not-configured`. |
| `GOOGLE_CLIENT_SECRET` | **Yes** | `app/api/auth/callback/route.ts` | OAuth client secret used during the token exchange. |
| `APP_URL` | Recommended | `lib/session.ts` (`appUrl()`) | Base URL for OAuth redirects and post-login redirects. Defaults to `http://localhost:3000`. |
| `JEV_AGENT_KEY` | Optional | `lib/jev.ts` | Jev/TypeSafe key for deterministic routing. |
| `TYPESAFE_API_KEY` | Optional | `lib/jev.ts` | Fallback alias for `JEV_AGENT_KEY`. |
| `GROQ_API_KEY` | Optional | `lib/groq.ts` | Groq key for extraction and summarization. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | `lib/supabase.ts` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | `lib/supabase.ts` | Supabase service role key (server-side only). |

## How `APP_URL` is used

`appUrl()` in `lib/session.ts` resolves the base URL once:

```ts
export function appUrl() {
  return process.env.APP_URL ?? 'http://localhost:3000'
}
```

It builds:

- the OAuth `redirect_uri` (`${APP_URL}/api/auth/callback`), and
- the post-auth redirects on success and error (`/dashboard`, `/?error=…`).

Because the same value is sent to Google and used to redirect back, a mismatch with your
registered redirect URI is the most common setup error. See
[troubleshooting.md](troubleshooting.md#redirect_uri_mismatch).

## Fallback behaviour

MailOS is designed to run with **zero** AI and database keys. Each optional integration
fails soft:

| Missing config | Effect |
| --- | --- |
| `JEV_AGENT_KEY` / `TYPESAFE_API_KEY` | `classifyEmail()` uses the keyword heuristic in `lib/jev.ts`. Routing still works, mapped onto your configured categories. |
| `GROQ_API_KEY` | `extractActions()` and `summarizeEmail()` use the regex heuristics in `lib/groq.ts`. Amounts, dates, and times may be less accurate. |
| `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` | `getSupabase()` returns `null` and `persistInbox()` returns `{ persisted: false }`. The pipeline still responds with emails and stats. |

When a key **is** present but the upstream call fails (non-2xx or a network error), the same
heuristics run and the request still succeeds. Errors are swallowed intentionally so a flaky
provider never breaks the inbox view.

## Client-side state

Two `localStorage` keys hold browser state (see `components/mailos-provider.tsx`):

| Key | Contents |
| --- | --- |
| `mailos-inbox-v2` | Last processed emails, stats, processed flag, and completed IDs. |
| `mailos-categories` | The user's category definitions. |

Clearing site data resets both. Deleting `mailos-inbox-v2` forces a fresh Gmail fetch on the
next load; deleting `mailos-categories` restores the defaults.

## Precedence and defaults

- Category input is always passed through `sanitizeCategories()` before use. Invalid,
  duplicate, or malformed entries are dropped, and `OTHER` is appended if missing. If the
  result is empty, `DEFAULT_CATEGORIES` is used.
- Category names are normalized to upper-snake-case (max 32 characters); descriptions are
  collapsed whitespace, max 200 characters. The category count is capped at
  `MAX_CATEGORIES` (60).

## Security

- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. Never expose it to the browser or
  commit it; it is only read in server-side code.
- The Gmail access token lives in the `mailos_session` cookie. The cookie is `httpOnly`,
  `sameSite=lax`, and `secure` in production, but the token itself is base64url-encoded, not
  encrypted. Always serve production over HTTPS and log out to invalidate.
- `.env` is git-ignored. Do not commit real keys.
