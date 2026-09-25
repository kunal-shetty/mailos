# Getting Started

This guide takes you from a fresh clone to a working MailOS instance. The Google OAuth
setup is the only mandatory integration; Jev, Groq, and Supabase are optional and degrade
gracefully.

- [1. Requirements](#1-requirements)
- [2. Install dependencies](#2-install-dependencies)
- [3. Configure environment variables](#3-configure-environment-variables)
- [4. Google OAuth setup](#google-oauth-setup)
- [5. AI providers (optional)](#5-ai-providers-optional)
- [6. Supabase (optional)](#6-supabase-optional)
- [7. Run the app](#7-run-the-app)
- [8. Verify it works](#8-verify-it-works)
- [9. Production build](#9-production-build)

---

## 1. Requirements

| Requirement | Notes |
| --- | --- |
| Node.js **20.9+** | Next.js 16 and Tailwind 4's native binaries require it. Node 20 or 22 LTS are the safest picks. |
| pnpm **12** | Pinned in `package.json` as `packageManager: pnpm@12.3.4`. `npm install` also works. |
| A Google account | Needed to create the OAuth client and to test the inbox connection. |
| (Optional) Jev key | Deterministic classifier. Without it MailOS uses keyword heuristics. |
| (Optional) Groq key | Action extraction and summaries. Without it MailOS uses regex heuristics. |
| (Optional) Supabase project | Persists processed mail. Persistence is skipped when unset. |

## 2. Install dependencies

```bash
git clone https://github.com/kunal-shetty/mailos.git mailos
cd mailos

pnpm install
```

If you use npm instead, run `npm install` — the app itself does not depend on pnpm at
runtime.

## 3. Configure environment variables

Create your local env file from the template:

```bash
cp .env.example .env
```

`.env` is git-ignored. Open it and fill in at least the Google values plus `APP_URL`:

```dotenv
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
APP_URL=http://localhost:3000
```

Each variable and its fallback behaviour is documented in
[configuration.md](configuration.md).

## Google OAuth setup

MailOS requests the `gmail.readonly` scope, which lets it list and read messages but never
modify your mailbox. Follow these steps exactly — the redirect URI must match character for
character.

### 1. Create or select a Google Cloud project

Go to the [Google Cloud Console](https://console.cloud.google.com/), then use the project
picker at the top to create a new project or select an existing one.

### 2. Enable the Gmail API

Navigate to **APIs & Services → Library**, search for **Gmail API**, open it, and click
**Enable**.

> Skipping this step produces a `403` with *"Gmail API has not been used in project … or it
> is disabled."* MailOS surfaces this message directly in the UI.

### 3. Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose a user type:
   - **External** for personal Gmail accounts. The app starts in *Testing* mode, where only
     accounts you add as **Test users** can authorize it.
   - **Internal** for Google Workspace organizations.
3. Fill in the app name, support email, and developer contact.
4. Add the scope `https://www.googleapis.com/auth/gmail.readonly`.
5. While in Testing mode, add your own Google account under **Test users**.

### 4. Create the OAuth client

1. Go to **APIs & Services → Credentials**.
2. Click **Create credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Under **Authorized redirect URIs**, add:

   ```
   http://localhost:3000/api/auth/callback
   ```

5. Click **Create** and copy the **Client ID** and **Client secret**.

The redirect URI is derived from `APP_URL` as `${APP_URL}/api/auth/callback` (see
`app/api/auth/google/route.ts`). If `APP_URL` is not `http://localhost:3000`, register the
matching URI instead.

### 5. Paste the credentials

```dotenv
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
```

## 5. AI providers (optional)

### Jev / TypeSafe (routing)

1. Get an API key from [api.typesafe.ai](https://api.typesafe.ai).
2. Set it as `JEV_AGENT_KEY` (or `TYPESAFE_API_KEY` — MailOS checks both).

MailOS posts to `https://api.typesafe.ai/v1/systemone` with model `jev-latest` and a set of
choice questions built from your configured categories. See
[email-pipeline.md](email-pipeline.md#classification-with-jev).

### Groq (extraction + summaries)

1. Create a key at [console.groq.com/keys](https://console.groq.com/keys).
2. Set it as `GROQ_API_KEY`.

MailOS uses `llama-3.1-8b-instant` via the OpenAI-compatible endpoint for two operations:
structured action extraction and email summarization.

## 6. Supabase (optional)

Persistence lets processed mail survive beyond a single browser.

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](../supabase/schema.sql),
   and run it.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** secret → `SUPABASE_SERVICE_ROLE_KEY`

> The service role key bypasses Row Level Security. Keep it server-side only; it is read
> exclusively in `lib/supabase.ts`.

Details: [database.md](database.md).

## 7. Run the app

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) and click **Connect Gmail**. After
granting access, Google redirects back to `/api/auth/callback`, which sets the session
cookie and forwards you to `/dashboard`. The dashboard processes your inbox on first load.

## 8. Verify it works

| Check | Expected |
| --- | --- |
| Landing page loads | Header, headline, and **Connect Gmail** button appear. |
| `/api/auth/me` while signed out | `401` with `{ "user": null }`. |
| After connecting Gmail | You land on `/dashboard` with your name in the greeting. |
| Dashboard loads | Stat cards populate and the inbox processes (a processing overlay runs). |
| `/settings` | Category list is editable; **Reset to defaults** restores the defaults. |
| `/actions` | Action queue is sorted by priority. |
| Signed-out access to `/dashboard` | Redirected to `/`. |

If a step fails, see [troubleshooting.md](troubleshooting.md).

## 9. Production build

```bash
pnpm build
pnpm start
```

`pnpm build` compiles the app and type-checks the project. Note that
`next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so a successful build does
**not** guarantee the TypeScript is error-free — run `npx tsc --noEmit` to check types
explicitly.

For deployment steps and the extra environment configuration production needs, see the
[Deployment section of the README](../README.md#deployment).
