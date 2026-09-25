# Contributing to MailOS

Thanks for helping improve MailOS. This guide covers the development setup, conventions, and
review expectations.

## Before you start

- Read [docs/getting-started.md](docs/getting-started.md) to get a working local instance.
- Skim [docs/architecture.md](docs/architecture.md) to understand how the pieces fit.
- For anything non-trivial, open an issue describing the change before writing code.

## Development setup

```bash
git clone https://github.com/kunal-shetty/mailos.git mailos
cd mailos
pnpm install
cp .env.example .env
# fill in at least GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and APP_URL
pnpm dev
```

## Project conventions

- **TypeScript everywhere.** `strict` is on; avoid `any` and prefer precise types in
  `types/index.ts` for anything shared.
- **Match the surrounding style.** No semicolons, single quotes, and the existing Tailwind
  token vocabulary (e.g. `bg-[#171717]`, `text-[12px]`).
- **Keep the AI and database layers optional.** Any new external dependency must fail soft
  and provide a deterministic fallback, mirroring `lib/jev.ts` and `lib/groq.ts`. The app must
  keep working with no keys configured.
- **Categories are data.** Do not hard-code category names outside the defaults in
  `lib/categories.ts`; new behavior should key off the user's configured list.
- **Server code stays server-side.** Never import `lib/supabase.ts` (service role) or read
  `SUPABASE_SERVICE_ROLE_KEY` from a client component.
- **Comments explain "why", not "what".** Follow the existing sparse, intent-focused
  commenting style.

## Checks

Run these before opening a pull request:

```bash
# Type-check (the build itself ignores type errors, so run this explicitly)
npx tsc --noEmit

# Production build
pnpm build
```

There is no test suite yet. If you add one, wire it into `package.json` and note the command
here.

## Adding a category by default

1. Add the entry to `DEFAULT_CATEGORIES` in `lib/categories.ts` with a **distinct** rule
   written as a description. Overlapping descriptions cause fuzzy routing.
2. Optionally add a matching tone in the `KNOWN_TONES` map in `lib/priority.ts`. Without one,
   the category still renders using a hash-derived fallback tone.
3. Optionally add keyword hints in the `KEYWORDS` map in `lib/jev.ts` to improve the offline
   heuristic.

## Adding an API route

- Put the handler under `app/api/<name>/route.ts`.
- Start every non-public handler with the session guard:

  ```ts
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  ```

- Parse input defensively and return a friendly `{ error }` body with an appropriate status.
- Document the endpoint in [docs/api-reference.md](docs/api-reference.md).

## Pull request checklist

- [ ] `npx tsc --noEmit` passes.
- [ ] `pnpm build` succeeds.
- [ ] The change works without any AI or Supabase keys configured.
- [ ] New environment variables are added to `.env.example`, the README table, and
      [docs/configuration.md](docs/configuration.md).
- [ ] User-facing behavior changes are reflected in the docs.
- [ ] The diff is focused; unrelated formatting changes are avoided.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) with a scope, matching the
existing history:

```
feat(api): accept configured categories when processing
fix(auth): stop redirecting to the demo login
docs(setup): document the Google OAuth redirect URI
chore(config): document the TypeSafe Jev endpoint
```

Common types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
