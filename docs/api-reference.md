# API Reference

MailOS exposes its HTTP API through Next.js route handlers under `app/api/`. The auth
routes are public; every other route requires a valid `mailos_session` cookie and returns
`401 { "error": "Unauthorized" }` without one.

- [Conventions](#conventions)
- [Authentication](#authentication)
- [Data](#data)
- [Error handling](#error-handling)

## Conventions

- All request and response bodies are JSON.
- `CategoryDef` is `{ "name": string, "description": string }`. Names are normalized to
  upper-snake-case; invalid entries are dropped.
- Responses that return email objects use the `MailEmail` shape (see
  [architecture.md](architecture.md#types)).

## Authentication

### `GET /api/auth/google`

Starts the OAuth flow. Requires no session.

- **200/302** — redirects to Google's consent screen requesting
  `openid email profile gmail.readonly`.
- **302** — `/?error=google-not-configured` when `GOOGLE_CLIENT_ID` is unset.

### `GET /api/auth/callback?code=…`

Exchanges the authorization code for tokens and creates the session.

| Result | Response |
| --- | --- |
| Success | Sets `mailos_session` and redirects to `/dashboard`. |
| No `code` | Redirects to `/?error=oauth`. |
| Token exchange failed | Redirects to `/?error=token`. |

### `GET /api/auth/logout`

Clears the session cookie and redirects to `/`. No session required.

### `GET /api/auth/me`

Returns the current user, without the access token.

```json
// 200
{
  "user": {
    "email": "you@example.com",
    "name": "You",
    "picture": "https://…",
    "mode": "google"
  }
}
```

```json
// 401
{ "user": null }
```

## Data

### `POST /api/process`

Runs the full inbox pipeline for the signed-in user: Gmail fetch → Jev classify → Groq
extract → stats → optional Supabase persist.

**Request**

```json
{
  "categories": [
    { "name": "INTERVIEW", "description": "Interview scheduling or invites" }
  ]
}
```

`categories` is optional. When omitted or invalid, `DEFAULT_CATEGORIES` are used. The list
is always passed through `sanitizeCategories()` first.

**Response `200`**

```json
{
  "emails": [
    {
      "id": "18f…",
      "subject": "Interview invitation",
      "sender": "Acme Recruiting",
      "senderEmail": "talent@acme.com",
      "snippet": "We'd love to schedule…",
      "body": "…",
      "bodyHtml": "<div>…</div>",
      "receivedAt": "2026-09-25T09:12:00.000Z",
      "unread": true,
      "jev": {
        "category": "INTERVIEW",
        "priority": "HIGH",
        "needs_reply": true,
        "calendar": true,
        "confidence": 0.93
      },
      "groq": {
        "company": "Acme",
        "date": "2026-09-30",
        "time": "3 PM",
        "amount": null,
        "actions": ["Reply", "Set Reminder"]
      }
    }
  ],
  "stats": {
    "unread": 12,
    "recruiters": 4,
    "interviews": 2,
    "invoices": "₹4,200",
    "followUps": 3
  },
  "source": "gmail"
}
```

**Errors**

| Status | Body | Cause |
| --- | --- | --- |
| `401` | `{ "error": "Unauthorized" }` | No session. |
| `500` | `{ "error": "…" }` | Pipeline failure, e.g. `No Gmail access token. Reconnect your Google account.` |

### `POST /api/analyze`

Classifies, extracts actions from, and summarizes a **single** email. No Gmail or Supabase
calls. Useful for previewing how a draft or template would be routed.

**Request**

```json
{
  "subject": "Invoice for September",
  "body": "Please find attached invoice #1042 for ₹4,200 due 2026-09-30.",
  "sender": "Billing <billing@vendor.com>",
  "categories": [{ "name": "INVOICE", "description": "A bill asking you to pay" }]
}
```

`body` is required; `subject`, `sender`, and `categories` are optional.

**Response `200`**

```json
{
  "jev": { "category": "INVOICE", "priority": "HIGH", "needs_reply": false, "calendar": false, "confidence": 0.9 },
  "groq": { "company": "Vendor", "date": "2026-09-30", "time": null, "amount": "₹4,200", "actions": ["Pay Invoice"] },
  "summary": "Vendor has sent invoice #1042 for ₹4,200, due September 30.",
  "highlights": ["Invoice #1042", "₹4,200 due 2026-09-30"]
}
```

**Errors**

| Status | Body | Cause |
| --- | --- | --- |
| `400` | `{ "error": "Missing email body" }` | Empty or missing `body`. |
| `401` | `{ "error": "Unauthorized" }` | No session. |
| `500` | `{ "error": "…" }` | Unexpected failure. |

### `POST /api/classify`

Jev classification only. Does **not** accept custom categories — it classifies against the
default set.

**Request**

```json
{ "subject": "Quick call?", "body": "Can we catch up tomorrow at 3 PM?", "sender": "Ada <ada@example.com>" }
```

**Response `200`** — a `JevResult`:

```json
{ "category": "MEETING", "priority": "HIGH", "needs_reply": true, "calendar": true, "confidence": 0.82 }
```

### `POST /api/extract`

Groq action extraction only.

**Request**

```json
{ "subject": "Invoice #1042", "body": "Due 2026-09-30 for ₹4,200.", "sender": "Billing <billing@vendor.com>" }
```

**Response `200`** — a `GroqResult`:

```json
{ "company": "Vendor", "date": "2026-09-30", "time": null, "amount": "₹4,200", "actions": ["Pay Invoice"] }
```

### `GET /api/gmail`

Fetches up to 30 raw inbox messages without classification.

**Response `200`**

```json
{ "emails": [ /* normalized messages without jev/groq */ ], "source": "gmail" }
```

**Errors**

| Status | Body | Cause |
| --- | --- | --- |
| `400` | `{ "error": "Reconnect your Google account." }` | Session has no access token. |
| `401` | `{ "error": "Unauthorized" }` | No session. |
| `502` | `{ "error": "…" }` | Gmail request failed; message mirrors Google's explanation. |

## Error handling

- Data routes catch pipeline errors and return `500` with a human-readable `error` string.
- `/api/classify` and `/api/extract` read the body directly, so a request with malformed
  JSON surfaces as a server error rather than a friendly `400`. The other routes parse
  defensively with `req.json().catch(() => ({}))`.
- AI and database failures do **not** produce errors here — they fall back to heuristics or
  skip persistence, so `/api/process` succeeds whenever Gmail succeeds.
