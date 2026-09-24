import { NextResponse } from 'next/server'
import { fetchLatestEmails } from '@/lib/gmail'
import { demoEmails } from '@/lib/demo-data'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.mode === 'demo' || !session.accessToken) {
    return NextResponse.json({ emails: demoEmails, source: 'demo' })
  }

  const emails = await fetchLatestEmails(session.accessToken, 30)
  return NextResponse.json({ emails, source: 'gmail' })
}
