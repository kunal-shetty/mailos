# MailOS Documentation

MailOS turns a Gmail inbox into a structured action queue: it routes every message into a
category you control, extracts the concrete action, and surfaces what needs a human.

This directory is the canonical reference. The [README](../README.md) is a quick overview;
the pages below go deeper.

## Start here

| If you want to… | Read |
| --- | --- |
| Get MailOS running locally from scratch | [getting-started.md](getting-started.md) |
| Know what every environment variable does | [configuration.md](configuration.md) |
| Understand how the code is organized | [architecture.md](architecture.md) |
| Understand how an email becomes an action | [email-pipeline.md](email-pipeline.md) |
| Call the HTTP API | [api-reference.md](api-reference.md) |
| Set up or inspect the database | [database.md](database.md) |
| Fix an error | [troubleshooting.md](troubleshooting.md) |
| Contribute code | [../CONTRIBUTING.md](../CONTRIBUTING.md) |

## At a glance

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Auth:** Google OAuth 2.0 with the `gmail.readonly` scope
- **Routing AI:** Jev / TypeSafe System One (deterministic classification)
- **LLM:** Groq `llama-3.1-8b-instant` (action extraction + summarization)
- **Storage:** Supabase Postgres (optional) + browser `localStorage`

## Minimal path to a working app

1. `pnpm install`
2. `cp .env.example .env`
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `APP_URL`.
4. Add `http://localhost:3000/api/auth/callback` as an authorized redirect URI.
5. `pnpm dev`, then click **Connect Gmail**.

Jev, Groq, and Supabase are optional. Without them, MailOS still runs using built-in
heuristics and skips persistence — see [configuration.md](configuration.md#fallback-behaviour).

## Documentation conventions

- Paths are written relative to the repository root.
- Environment variables are written in `UPPER_SNAKE_CASE` and shown without values.
- Code references point at the module that owns the behaviour (for example
  `lib/pipeline.ts`).
