# Email Pipeline

This document follows an email from the Gmail API to a rendered action. The orchestration
lives in `lib/pipeline.ts`; the individual steps live in `lib/gmail.ts`, `lib/jev.ts`,
`lib/groq.ts`, and `lib/supabase.ts`.

```
processInbox(user, categories)
  1. fetchLatestEmails(accessToken, 30)   lib/gmail.ts
  2. classifyEmail({ subject, body, sender, categories })   lib/jev.ts   ──▶ Jev
  3. extractActions({ subject, body, sender })              lib/groq.ts  ──▶ Groq
  4. statsFrom(emails)                    lib/pipeline.ts
  5. persistInbox(user.email, emails)     lib/supabase.ts ──▶ Supabase
  → { emails, stats, source: 'gmail' }
```

Every AI step has a deterministic heuristic fallback, so a missing key or a failing provider
never rejects the request.

## 1. Fetching from Gmail

`fetchLatestEmails(accessToken, max = 30)` in `lib/gmail.ts`:

1. Lists inbox messages:
   `GET https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&labelIds=INBOX`.
2. Fetches each message individually with `format=full`, in parallel. Individual message
   failures are logged and skipped rather than failing the batch.
3. Maps each message into a normalized shape.

### Normalizing a message

- **Headers:** `From` is parsed into `{ name, email }`; `Subject` defaults to `(no subject)`.
- **Body:** the MIME tree is walked to collect `text/plain` and `text/html` parts.
  `stripHtml()` reduces HTML to readable text. The plain-text body prefers the text part and
  falls back to stripped HTML, truncated to 12,000 characters. Raw HTML is kept separately,
  truncated to 20,000 characters.
- **Snippet:** Gmail's snippet, or the first 140 characters of the body.
- **`receivedAt`:** derived from `internalDate`.
- **`unread`:** true when `labelIds` includes `UNREAD`.

### Auth and errors

If a message is authorized only through the readonly scope, no write labels are available —
which is fine, as MailOS never writes. Gmail errors are converted into actionable messages
by `gmailError()`:

- `401` → ask the user to reconnect the Google account.
- `403` with "has not been used" / "is disabled" → tell the user to enable the Gmail API.

These messages surface directly in the UI via the pipeline's error state.

## 2. Classification with Jev

`classifyEmail()` in `lib/jev.ts` sends one request to TypeSafe:

- **Endpoint:** `POST https://api.typesafe.ai/v1/systemone`
- **Model:** `jev-latest`
- **State:** `{ subject, body (first 4,000 chars), sender }`
- **Questions:**
  - `category` — a choice whose criteria are built from your category list
    (`name → description`). This is why each category needs a sharp description.
  - `priority` — a choice of `HIGH` / `MEDIUM` / `LOW` with urgency descriptions.
  - `needs_reply` — a binary (`noul`) question.
  - `calendar` — a binary (`noul`) question.

Responses are read from `data.answers`:

| Answer | Interpretation |
| --- | --- |
| `answers.category.choice` | Must match a configured name, else the first configured category. |
| `answers.priority.choice` | One of `HIGH`/`MEDIUM`/`LOW`, else `MEDIUM`. |
| `answers.needs_reply.noul` | `>= 0.5` is true. |
| `answers.calendar.noul` | `>= 0.5` is true. |
| `answers.category.confidence` | Float, default `0.8`. |

### Heuristic fallback

Used when no key is set, the request is non-2xx, or it throws:

- **Category:** matches `SPAM` keywords first, then walks the configured categories in order
  and picks the first with a keyword hit. Categories without an entry in the internal
  `KEYWORDS` map fall back to their name split on `_`, ignoring parts of length ≤ 3.
- **Priority:** `HIGH` for interview/meeting categories or for `tomorrow`/`today`/`urgent`/
  `due`; `LOW` for `SPAM`, `NEWSLETTER`, `NOTIFICATION`, `OTHER`; otherwise `MEDIUM`.
- **`needs_reply` / `calendar`:** derived from the matched category, with a light keyword
  check for times.
- **Confidence:** fixed at `0.82`.

The fallback always maps onto your configured categories, so custom setups keep working.

## 3. Extraction and summary with Groq

`lib/groq.ts` exports two functions, both hitting
`POST https://api.groq.com/openai/v1/chat/completions` with model `llama-3.1-8b-instant`
and `response_format: { type: 'json_object' }`.

### `extractActions()` — temperature 0

Returns `{ company, date, time, amount, actions }`. `date`, `time`, and `amount` are strings
or `null`; `actions` is a short list such as `Reply`, `Set Reminder`, `Pay Invoice`. Missing
fields fall back to the heuristic's value, and `actions` defaults to `['Reply']`.

### `summarizeEmail()` — temperature 0.2

Returns `{ summary, highlights }`: 2–3 plain sentences plus up to four concrete facts. Used by
`/api/analyze` to populate the email detail view.

### Heuristic fallback

- `extractActions` scans for a time (`3 PM`), a date (`tomorrow`, `friday`, …), and an amount
  (₹ or $), infers the company from the sender domain or display name, and pushes actions
  based on keyword matches.
- `summarizeEmail` picks the first sentence between 30 and 240 characters, or the first 220
  characters as a last resort.

## 4. Aggregating stats

`statsFrom()` in `lib/pipeline.ts` produces the dashboard's `DashboardStats`:

| Field | Derivation |
| --- | --- |
| `unread` | Count of emails with `unread` true. |
| `recruiters` | Count of `RECRUITER`. |
| `interviews` | Count of `INTERVIEW`. |
| `invoices` | The first non-empty extracted `amount`, else `` `${n} open` ``, else `₹0`. |
| `followUps` | Count of `FOLLOW_UP`. |

Note that the stat names are hard-coded to the default category names, while the routing and
queue are fully configurable.

## 5. Persisting to Supabase

`persistInbox(owner, emails)` in `lib/supabase.ts`:

- Returns `{ persisted: false }` immediately when Supabase is unconfigured.
- Upserts one `emails` row per message (metadata only).
- Upserts one `ai_results` row per message (`onConflict: 'email_id'`) with the category,
  priority, confidence, and the extracted actions plus the full `jev`/`groq` payloads under
  `extra`.

See [database.md](database.md) for the schema.

## Single-email analysis

`POST /api/analyze` runs classification, extraction, and summarization concurrently for one
email body, without touching Gmail or Supabase. It returns
`{ jev, groq, summary, highlights }`. The granular `POST /api/classify` and
`POST /api/extract` endpoints expose the individual steps.

## Choosing an inbox size

`processInbox()` currently hard-codes a batch of 30 (`fetchLatestEmails(user.accessToken, 30)`).
Larger batches mean more per-message AI calls, so raise it deliberately.
