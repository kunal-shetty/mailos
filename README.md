# MailOS

**Your inbox is an operating system.**

MailOS turns a messy Gmail inbox into a structured action queue. It reads your latest
mail, routes each message into a category you control, extracts the concrete action
(interview, invoice, follow-up, …) and surfaces what needs a human response — instead
of leaving you to live in folders.

> **Status:** early development (`0.1.0`). Interfaces and environment variables may change.

---

## Table of contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
  - [1. Clone and install](#1-clone-and-install)
  - [2. Configure environment variables](#2-configure-environment-variables)
  - [3. Set up Google OAuth (Gmail)](#3-set-up-google-oauth-gmail)
  - [4. Set up the AI providers](#4-set-up-the-ai-providers)
  - [5. Set up Supabase (optional)](#5-set-up-supabase-optional)
  - [6. Run the app](#6-run-the-app)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Routes](#routes)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Security notes](#security-notes)
- [License](#license)

---

## What it does

- **Connects to Gmail** via Google OAuth with read-only access, and pulls the newest
  inbox messages.
- **Routes every email** into a category (`INTERVIEW`, `INVOICE`, `RECRUITER`,
  `FOLLOW_UP`, and more) using [Jev / TypeSafe](https://api.typesafe.ai), a deterministic
  classifier. Categories are fully user-configurable.
- **Extracts the action** — company, date, time, amount, and a short action list — using
  [Groq](https://groq.com) running `llama-3.1-8b-instant`.
- **Summarizes each email** into 2–3 plain sentences plus a few concrete highlights.
- **Builds a dashboard** of unread, recruiter, interview, invoice, and follow-up counts.
- **Presents an action queue** sorted by priority, with a color-coded tone per category.
- **Works offline of any AI provider** — if Jev, Groq, or Supabase are not configured,
  MailOS falls back to deterministic heuristics so the app still runs end to end.

## How it works

```
                    ┌──────────────────────────────────────────────────────────┐
  Gmail (readonly)  │                     Next.js App Router                   │
  access token ───▶ │  /api/process                                            │
                    │    1. fetchLatestEmails()   lib/gmail.ts                 │
                    │    2. classifyEmail()       lib/jev.ts      ──▶ Jev API  │
                    │    3. extractActions()      lib/groq.ts     ──▶ Groq API │
                    │    4. statsFrom()           lib/pipeline.ts              │
                    │    5. persistInbox()        lib/supabase.ts ──▶ Supabase │
                    │  ◀── { emails, stats }                                    │
                    └──────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                       MailosProvider (React context, localStorage)
                                        │
                    ┌───────────────────┼────────────────────┐
                    ▼                   ▼                    ▼
               Dashboard            Actions             Email detail
                                                          Settings
```

Each AI step has a heuristic fallback, so a missing key degrades quality but never
breaks the request. See [docs/email-pipeline.md](docs/email-pipeline.md) for the full
walkthrough.

## Tech stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | [Next.js](https://nextjs.org) 16 (App Router, React 19)       |
| Language   | TypeScript 5.7                                                 |
| Styling    | Tailwind CSS 4, `tw-animate-css`, shadcn UI primitives         |
| Motion     | Framer Motion                                                  |
| Icons      | lucide-react                                                   |
| Routing AI | Jev (TypeSafe System One) — deterministic classification       |
| LLM        | Groq (`llama-3.1-8b-instant`) — extraction + summarization     |
| Auth       | Google OAuth 2.0 (Gmail read-only) + signed session cookie     |
| Storage    | Supabase (Postgres) — optional persistence                     |
| Analytics  | Vercel Analytics (production only)                             |

## Prerequisites

- **Node.js 20.9 or newer** (20 LTS or 22 LTS recommended)
- **pnpm 12** — this repo pins `packageManager: pnpm@12.3.4`. npm also works, but pnpm is
  the source of truth for the lockfile.
- A **Google Cloud project** with the Gmail API enabled (required to connect an inbox)
- Optional: API keys for **Jev** and **Groq**, and a **Supabase** project

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/kunal-shetty/mailos.git mailos
cd mailos

# pnpm is recommended (matches packageManager in package.json)
pnpm install

# or, with npm
npm install
```

### 2. Configure environment variables

Copy the template and fill in the values:

```bash
cp .env.example .env
```

```dotenv
# Google OAuth (Gmail readonly)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APP_URL=http://localhost:3000

# Jev (TypeSafe System One) — deterministic email routing
# Also accepts TYPESAFE_API_KEY.
JEV_AGENT_KEY=

# Groq — action extraction and summarization
GROQ_API_KEY=

# Supabase (optional — persistence is skipped when unset)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

The full reference lives in [docs/configuration.md](docs/configuration.md).

### 3. Set up Google OAuth (Gmail)

This is the only **required** integration — without it the app cannot fetch an inbox.

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create (or pick)
   a project.
2. Under **APIs & Services → Library**, enable the **Gmail API**.
3. Under **APIs & Services → OAuth consent screen**, configure an *External* (or *Internal*
   for Workspace) app. Add the scope `https://www.googleapis.com/auth/gmail.readonly` and
   add your own Google account under **Test users** while the app is in testing mode.
4. Under **APIs & Services → Credentials → Create credentials → OAuth client ID**, choose
   **Web application**.
5. Add an authorized redirect URI that exactly matches your `APP_URL`:

   ```
   http://localhost:3000/api/auth/callback
   ```

   (For production, add your deployed callback as a second URI.)
6. Copy the **Client ID** and **Client secret** into `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET`.

The exact redirect URI must match, or Google returns `redirect_uri_mismatch`. Full
walkthrough with screenshots-level detail is in
[docs/getting-started.md](docs/getting-started.md#google-oauth-setup).

### 4. Set up the AI providers

Both are optional but strongly recommended — without them MailOS uses keyword heuristics.

- **Jev / TypeSafe** — create a key at [api.typesafe.ai](https://api.typesafe.ai) and set
  `JEV_AGENT_KEY` (or `TYPESAFE_API_KEY`).
- **Groq** — create a key in the [Groq console](https://console.groq.com/keys) and set
  `GROQ_API_KEY`.

### 5. Set up Supabase (optional)

Persistence is skipped entirely when Supabase is not configured. To enable it:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. From **Project Settings → API**, copy the **Project URL** into
   `NEXT_PUBLIC_SUPABASE_URL` and the **service role** key into
   `SUPABASE_SERVICE_ROLE_KEY`.

See [docs/database.md](docs/database.md) for the schema and RLS considerations.

### 6. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Connect Gmail**. After
granting access you land on the dashboard, which processes your inbox automatically the
first time.

For a production check:

```bash
pnpm build && pnpm start
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | **Yes** | OAuth client ID from Google Cloud. |
| `GOOGLE_CLIENT_SECRET` | **Yes** | OAuth client secret. |
| `APP_URL` | Recommended | Base URL used to build the OAuth redirect and post-login redirects. Defaults to `http://localhost:3000`. |
| `JEV_AGENT_KEY` | Optional | Jev/TypeSafe key for deterministic routing. Falls back to `TYPESAFE_API_KEY`. |
| `TYPESAFE_API_KEY` | Optional | Alias for `JEV_AGENT_KEY`. |
| `GROQ_API_KEY` | Optional | Groq key for action extraction + summarization. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL. Persistence is skipped if unset. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase service role key (server-side only). |

Full behaviour and fallbacks: [docs/configuration.md](docs/configuration.md).

## Project structure

```
mailos/
├── app/
│   ├── (workspace)/            # Authenticated shell (sidebar layout)
│   │   ├── dashboard/          # Overview + stats
│   │   ├── actions/            # Priority-sorted action queue
│   │   ├── email/[id]/         # Single email detail
│   │   └── settings/           # Category editor
│   ├── api/
│   │   ├── auth/               # google, callback, logout, me
│   │   ├── process/            # Full inbox pipeline
│   │   ├── analyze/            # classify + extract + summarize one email
│   │   ├── classify/           # Jev classification only
│   │   ├── extract/            # Groq extraction only
│   │   └── gmail/              # Raw Gmail fetch
│   ├── layout.tsx              # Root layout + metadata
│   ├── page.tsx                # Landing page
│   └── globals.css             # Tailwind theme tokens
├── components/                 # UI: views, cards, provider, sidebar
│   └── ui/                     # shadcn primitives
├── lib/
│   ├── categories.ts           # Defaults, normalization, sanitization
│   ├── gmail.ts                # Gmail REST client + MIME/HTML parsing
│   ├── groq.ts                 # Action extraction + summarization
│   ├── jev.ts                  # TypeSafe classification + heuristic
│   ├── pipeline.ts             # processInbox orchestration + stats
│   ├── priority.ts             # Category tones, priority labels, headlines
│   ├── session.ts              # Cookie session + appUrl()
│   ├── supabase.ts             # Client + persistInbox()
│   └── utils.ts                # cn(), initials(), formatReceived()
├── types/index.ts              # Shared domain types
├── supabase/schema.sql         # Database schema
├── middleware.ts               # Route protection
└── docs/                       # Full documentation (start here)
```

## Routes

**Pages**

| Route | Auth | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page; connects Gmail. |
| `/dashboard` | Protected | Inbox overview and stats. |
| `/actions` | Protected | Action queue sorted by priority. |
| `/email/[id]` | Protected | Single email with analysis. |
| `/settings` | Protected | Category editor. |

**API** (all except the auth routes require a session cookie)

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/google` | Starts the Google OAuth flow. |
| `GET` | `/api/auth/callback` | Exchanges the code, sets the session cookie. |
| `GET` | `/api/auth/logout` | Clears the session. |
| `GET` | `/api/auth/me` | Returns the current user. |
| `POST` | `/api/process` | Runs the full inbox pipeline. |
| `POST` | `/api/analyze` | Classifies, extracts, and summarizes one email. |
| `POST` | `/api/classify` | Jev classification only. |
| `POST` | `/api/extract` | Groq action extraction only. |
| `GET` | `/api/gmail` | Fetches raw inbox messages. |

Full request/response shapes: [docs/api-reference.md](docs/api-reference.md).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server on port 3000. |
| `pnpm build` | Production build. |
| `pnpm start` | Serve the production build. |

## Deployment

MailOS deploys cleanly to [Vercel](https://vercel.com):

1. Import the repository.
2. Add every variable from `.env` to the project's environment settings.
3. Set `APP_URL` to the deployed URL (e.g. `https://mailos.example.com`).
4. Add the production callback URL `https://<your-domain>/api/auth/callback` to your
   Google OAuth client's authorized redirect URIs.
5. Deploy.

Vercel Analytics is enabled automatically when `NODE_ENV=production`.

## Documentation

| Document | Contents |
| --- | --- |
| [docs/getting-started.md](docs/getting-started.md) | Step-by-step local setup, including the Google Cloud and Supabase walkthroughs. |
| [docs/configuration.md](docs/configuration.md) | Every environment variable and how fallbacks behave. |
| [docs/architecture.md](docs/architecture.md) | Directory layout, data flow, session model, client state. |
| [docs/email-pipeline.md](docs/email-pipeline.md) | Gmail fetch → classification → extraction → persistence. |
| [docs/api-reference.md](docs/api-reference.md) | HTTP API reference with payloads. |
| [docs/database.md](docs/database.md) | Supabase schema, RLS, and persistence rules. |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common errors and fixes. |

## Security notes

- MailOS requests **Gmail read-only** access. It never sends, deletes, or modifies mail.
- The session cookie is `httpOnly`, `sameSite=lax`, and `secure` in production. It stores
  the Google access token encoded (base64url) but **not encrypted** — treat it as a
  session secret, keep the deployment HTTPS-only, and log out to invalidate it.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security and must never be exposed to the
  browser. It is only read in server-side code (`lib/supabase.ts`).
- Email bodies are sent to Jev and Groq for analysis. Review those providers' data
  policies before pointing MailOS at sensitive mail.

## License

[MIT](LICENSE) © 2026 Kunal Shetty
