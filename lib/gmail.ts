type GmailHeader = { name: string; value: string }
type GmailPayload = {
  mimeType?: string
  body?: { data?: string }
  parts?: GmailPayload[]
  headers?: GmailHeader[]
}

function header(headers: GmailHeader[] | undefined, name: string) {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function decodeB64(data?: string) {
  if (!data) return ''
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/')
  try {
    return Buffer.from(normalized, 'base64').toString('utf8')
  } catch {
    return ''
  }
}

function collectBody(payload: GmailPayload | undefined, out: { text: string; html: string }) {
  if (!payload) return out
  if (payload.body?.data) {
    const decoded = decodeB64(payload.body.data)
    if (payload.mimeType === 'text/html') out.html += decoded
    else if (payload.mimeType === 'text/plain') out.text += decoded
    else if (!out.text && !out.html) out.text += decoded
  }
  payload.parts?.forEach((part) => collectBody(part, out))
  return out
}

// Strip an HTML email down to readable text so Jev/Groq get clean input.
export function stripHtml(html: string) {
  return html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseFrom(from: string) {
  const match = from.match(/^(.*)<([^>]+)>$/)
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() }
  return { name: from.split('@')[0] || from, email: from }
}

// Pull Google's own explanation out of an error response so the UI can show it.
async function gmailError(res: Response) {
  const raw = await res.text().catch(() => '')
  let detail = raw
  try {
    const parsed = JSON.parse(raw)
    detail = parsed?.error?.message ?? parsed?.error_description ?? raw
  } catch {
    /* keep raw */
  }
  detail = detail.replace(/\s+/g, ' ').trim().slice(0, 300)

  if (res.status === 401) {
    return `Gmail rejected the access token (401). Reconnect your Google account.${detail ? ` ${detail}` : ''}`
  }
  if (res.status === 403 && /has not been used|is disabled|accessNotConfigured/i.test(detail)) {
    return `Gmail API is not enabled for this Google Cloud project. Enable it at https://console.cloud.google.com/apis/library/gmail.googleapis.com, wait a minute, then reconnect.${detail ? ` (${detail})` : ''}`
  }
  return `Gmail request failed (${res.status}).${detail ? ` ${detail}` : ''}`
}

export async function fetchLatestEmails(accessToken: string, max = 30) {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!listRes.ok) {
    throw new Error(await gmailError(listRes))
  }
  const list = await listRes.json()
  const ids: string[] = (list.messages ?? []).map((m: { id: string }) => m.id)

  const messages = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      if (!res.ok) {
        console.error(`Gmail message ${id} failed (${res.status}): ${await res.text().catch(() => '')}`)
        return null
      }
      return res.json()
    }),
  )

  return messages.filter(Boolean).map((msg) => {
    const payload = msg.payload as GmailPayload
    const from = parseFrom(header(payload.headers, 'From'))
    const raw = collectBody(payload, { text: '', html: '' })
    const html = raw.html.trim()
    const plain = (raw.text.trim() || (html ? stripHtml(html) : '')).slice(0, 12000)
    const snippet = (msg.snippet as string) || plain.slice(0, 140)
    return {
      id: msg.id as string,
      subject: header(payload.headers, 'Subject') || '(no subject)',
      sender: from.name,
      senderEmail: from.email,
      snippet,
      body: plain || snippet,
      bodyHtml: html ? html.slice(0, 20000) : null,
      receivedAt: msg.internalDate
        ? new Date(Number(msg.internalDate)).toISOString()
        : new Date().toISOString(),
      unread: Array.isArray(msg.labelIds) && msg.labelIds.includes('UNREAD'),
    }
  })
}
