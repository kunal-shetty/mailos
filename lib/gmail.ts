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

function extractText(payload?: GmailPayload): string {
  if (!payload) return ''
  if (payload.mimeType?.startsWith('text/plain') && payload.body?.data) {
    return decodeB64(payload.body.data)
  }
  if (payload.parts?.length) {
    const plain = payload.parts.find((p) => p.mimeType === 'text/plain')
    if (plain) return extractText(plain)
    return payload.parts.map(extractText).join('\n')
  }
  return decodeB64(payload.body?.data)
}

function parseFrom(from: string) {
  const match = from.match(/^(.*)<([^>]+)>$/)
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() }
  return { name: from.split('@')[0] || from, email: from }
}

export async function fetchLatestEmails(accessToken: string, max = 30) {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!listRes.ok) {
    throw new Error(`Gmail list failed (${listRes.status})`)
  }
  const list = await listRes.json()
  const ids: string[] = (list.messages ?? []).map((m: { id: string }) => m.id)

  const messages = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      if (!res.ok) return null
      return res.json()
    }),
  )

  return messages.filter(Boolean).map((msg) => {
    const payload = msg.payload as GmailPayload
    const from = parseFrom(header(payload.headers, 'From'))
    const body = extractText(payload).slice(0, 6000)
    return {
      id: msg.id as string,
      subject: header(payload.headers, 'Subject') || '(no subject)',
      sender: from.name,
      senderEmail: from.email,
      snippet: (msg.snippet as string) || body.slice(0, 140),
      body: body || (msg.snippet as string) || '',
      receivedAt: msg.internalDate
        ? new Date(Number(msg.internalDate)).toISOString()
        : new Date().toISOString(),
      unread: Array.isArray(msg.labelIds) && msg.labelIds.includes('UNREAD'),
    }
  })
}
