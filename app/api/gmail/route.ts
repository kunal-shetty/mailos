import { NextResponse } from 'next/server'
import { fetchLatestEmails } from '@/lib/gmail'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!session.accessToken) {
    return NextResponse.json({ error: 'Reconnect your Google account.' }, { status: 400 })
  }

  try {
    const emails = await fetchLatestEmails(session.accessToken, 30)
    return NextResponse.json({ emails, source: 'gmail' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gmail fetch failed' },
      { status: 502 },
    )
  }
}
