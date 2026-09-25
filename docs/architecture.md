# Architecture

MailOS is a Next.js App Router application. Server code handles authentication, Gmail
access, AI calls, and optional persistence. The browser holds the processed inbox in React
context and mirrors it to `localStorage`.

## High-level shape

```
Browser ──▶ Next.js App Router ──▶ Google Gmail API
                   │
                   ├──────────────▶ Jev / TypeSafe  (classification)
                   ├──────────────▶ Groq            (extraction + summary)
                   └──────────────▶ Supabase        (optional persistence)
```

## Directory layout

```
app/                         Routing + server entry points
  (workspace)/               Authenticated route group with a shared sidebar shell
    layout.tsx               Session guard; redirects to / when signed out
    dashboard/page.tsx       Overview + stat cards
    actions/page.tsx         Priority-sorted queue
    email/[id]/page.tsx      Single email detail
    settings/page.tsx        Category editor
  api/                       Route handlers (see docs/api-reference.md)
  layout.tsx                 Root layout, metadata, analytics
  page.tsx                   Public landing page
components/                  Client + presentational components
  mailos-provider.tsx        React context: emails, stats, categories, persistence
  DashboardView.tsx          Dashboard composition
  ActionQueueView.tsx        Queue view
  EmailDetailView.tsx        Detail view
  CategoriesSettings.tsx     Settings editor
  Sidebar.tsx, PageHeader.tsx, StatCard.tsx, EmailCard.tsx, ActionCard.tsx, …
  ui/                        shadcn primitives
lib/                         Framework-agnostic domain logic
  gmail.ts                   Gmail REST client, MIME walk, HTML→text
  jev.ts                     TypeSafe classification + heuristic fallback
  groq.ts                    Groq extraction/summary + heuristic fallback
  pipeline.ts                processInbox orchestration + stats
  categories.ts              Defaults, normalization, sanitization
  priority.ts                Category tones, priority labels, headlines
  session.ts                 Cookie session + appUrl()
  supabase.ts                Client + persistInbox()
  utils.ts                   cn(), initials(), formatReceived()
types/index.ts               Shared domain types
supabase/schema.sql          Database schema
middleware.ts                Route protection
```

## Request lifecycle: connecting Gmail

1. The user clicks **Connect Gmail** on `/`, hitting `GET /api/auth/google`
   (`app/api/auth/google/route.ts`).
2. The handler builds a Google consent URL from `GOOGLE_CLIENT_ID` and
   `${APP_URL}/api/auth/callback`, requesting `openid email profile gmail.readonly` with
   `access_type=offline` and `prompt=consent`.
3. Google redirects back to `GET /api/auth/callback` with a `code`.
4. The callback exchanges the code at `https://oauth2.googleapis.com/token`, fetches the
   profile from `https://www.googleapis.com/oauth2/v2/userinfo`, and stores a session.
5. The user is redirected to `/dashboard`.

Errors redirect to the landing page with a query flag: `?error=google-not-configured`,
`?error=oauth` (no code), or `?error=token` (token exchange failed).

## Session model

Sessions live in `lib/session.ts` and are stored in a single cookie, `mailos_session`.

- The value is `base64url(JSON.stringify(SessionUser))` — signed only by the browser's
  cookie semantics, **not** encrypted.
- Attributes: `httpOnly`, `sameSite=lax`, `path=/`, `secure` in production, `maxAge` of
  7 days.
- `SessionUser` carries `mode`, `email`, `name`, `picture`, and the Google `accessToken`.

Reading and writing are async because `cookies()` is async in Next 16. `clearSession()`
deletes the cookie on logout.

## Route protection

`middleware.ts` guards `/dashboard`, `/actions`, and `/email/:path*`, redirecting to `/`
when no `mailos_session` cookie is present. The workspace layout (`app/(workspace)/layout.tsx`)
also calls `getSession()` and redirects server-side, so protection does not depend on the
middleware alone. Every mutating API route re-checks `getSession()` and returns `401`
otherwise.

## Server pipeline

The core server-side flow is `processInbox()` in `lib/pipeline.ts`:

1. `fetchLatestEmails(accessToken, 30)` — lists INBOX messages and fetches each with
   `format=full`.
2. For each message, run `classifyEmail()` (Jev) and `extractActions()` (Groq).
3. Compute `DashboardStats` with `statsFrom()`.
4. Persist with `persistInbox()` (skipped if Supabase is unconfigured).
5. Return `{ emails, stats, source: 'gmail' }`.

The steps run per-message with `Promise.all`, and every AI call is guarded so a provider
failure falls back to heuristics instead of rejecting.

## Client state

`components/mailos-provider.tsx` exposes a `MailosContext` with:

- `emails`, `stats`, `processed`, `processing`, `error`, `completed`, `source`
- `categories`, `saveCategories()`, `processInbox()`, `toggleDone()`

On mount it:

1. restores categories from `mailos-categories`,
2. restores the inbox from `mailos-inbox-v2`,
3. if nothing was cached, calls `processInbox()` to fetch the real Gmail inbox.

It then writes the inbox back to `localStorage` whenever it changes. A `processingRef`
guard prevents overlapping pipeline runs. Because the inbox is cached client-side, a stale
inbox can be shown until the user hits **Re-process inbox**.

## Types

Shared domain types live in `types/index.ts`:

| Type | Shape |
| --- | --- |
| `Category` | `string` — categories are user-configurable, so no union. |
| `Priority` | `'HIGH' \| 'MEDIUM' \| 'LOW'` |
| `JevResult` | `{ category, priority, needs_reply, calendar, confidence }` |
| `GroqResult` | `{ company, date, time, amount, actions }` |
| `MailEmail` | Email metadata + body/html + `jev` + `groq` |
| `EmailAnalysis` | `{ jev, groq, summary, highlights }` |
| `SessionUser` | `{ mode, email, name, picture?, accessToken? }` |
| `DashboardStats` | `{ unread, recruiters, interviews, invoices, followUps }` |

## Rendering and styling

- Route handlers and workspace pages are async server components where they need a session.
- Interactive views (`DashboardView`, `ActionQueueView`, `EmailDetailView`,
  `CategoriesSettings`, `ProcessButton`) are client components under `MailosProvider`.
- Tailwind CSS 4 provides theme tokens in `app/globals.css`; `lib/priority.ts` maps
  categories to color tones, with a stable hash-derived fallback for custom categories.
- Fonts use `next/font` (Inter). Analytics render only when `NODE_ENV=production`.

## Design constraints

- **No database requirement.** Every persistence path is optional.
- **Fail soft.** AI and database errors must never break the inbox view.
- **Categories are data, not code.** The classifier, tones, and filters all key off the
  user's configured list rather than a fixed enum.
