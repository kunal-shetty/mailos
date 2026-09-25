# Database

MailOS uses [Supabase](https://supabase.com) (Postgres) for **optional** persistence. When
`NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing, `getSupabase()` returns
`null` and every write is skipped — the app runs entirely from client-side `localStorage`
instead.

For first-time setup steps, see [getting-started.md](getting-started.md#6-supabase-optional).

## Schema

The schema lives in [`supabase/schema.sql`](../supabase/schema.sql):

```sql
create table if not exists emails (
  id text primary key,
  owner text,
  subject text,
  sender text,
  snippet text,
  received_at timestamptz
);

create table if not exists ai_results (
  email_id text primary key references emails(id) on delete cascade,
  owner text,
  category text,
  priority text,
  confidence float,
  actions jsonb,
  extra jsonb
);
```

### `emails`

Normalized message metadata, keyed by the Gmail message id.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `text` | Primary key. The Gmail message ID. |
| `owner` | `text` | The signed-in user's email address. |
| `subject` | `text` | Message subject. |
| `sender` | `text` | Display name of the sender. |
| `snippet` | `text` | Gmail snippet or a body prefix. |
| `received_at` | `timestamptz` | Message timestamp. |

### `ai_results`

The AI verdict for a message, one row per email.

| Column | Type | Notes |
| --- | --- | --- |
| `email_id` | `text` | Primary key, foreign key to `emails.id` with `on delete cascade`. |
| `owner` | `text` | The signed-in user's email address. |
| `category` | `text` | The routed category name. |
| `priority` | `text` | `HIGH` / `MEDIUM` / `LOW`. |
| `confidence` | `float` | Classifier confidence. |
| `actions` | `jsonb` | The extracted action list, e.g. `["Reply"]`. |
| `extra` | `jsonb` | Full `{ jev, groq }` payloads for future use. |

## Applying the schema

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Paste the contents of `supabase/schema.sql` and run it.

The statements use `create table if not exists`, so re-running is safe.

## Persistence behaviour

`persistInbox(owner, emails)` in `lib/supabase.ts`:

1. Upserts one `emails` row per message.
2. Upserts one `ai_results` row per message with `{ onConflict: 'email_id' }`.

Upserts mean re-processing the same inbox is idempotent — rows are updated in place rather
than duplicated. Both writes are awaited before the pipeline returns.

## Row Level Security

`supabase/schema.sql` does **not** enable RLS. MailOS connects with the **service role** key,
which bypasses RLS by design. Consequences:

- Every row is reachable by the server regardless of policy — which is fine for a
  single-tenant/server-owned model but means the service key must stay secret.
- If you later expose Supabase to the browser or to third parties, enable RLS and add
  policies first. A minimal starting point:

  ```sql
  alter table emails enable row level security;
  alter table ai_results enable row level security;

  -- Example: only let an authenticated user read their own rows.
  create policy "own emails" on emails
    for select using (auth.jwt() ->> 'email' = owner);
  ```

Row ownership today is a plain text column (`owner`), not a foreign key to `auth.users`.
There is no index on it; add one if you query per user at scale:

```sql
create index if not exists emails_owner_idx on emails (owner);
create index if not exists ai_results_owner_idx on ai_results (owner);
```

## Inspecting data

Useful queries for the SQL editor:

```sql
-- Most recent messages with their verdict
select e.id, e.owner, e.subject, e.sender, e.received_at,
       a.category, a.priority, a.actions
from emails e
join ai_results a on a.email_id = e.id
order by e.received_at desc
limit 50;

-- Category distribution for one user
select category, count(*)
from ai_results
where owner = 'you@example.com'
group by category
order by count(*) desc;
```

## Data retention

MailOS stores derived metadata and AI results — the full HTML body is not persisted. To
clear a user's data:

```sql
delete from emails where owner = 'you@example.com';
-- ai_results rows cascade via the foreign key
```

The Gmail access token is never written to the database; it lives only in the session
cookie.
