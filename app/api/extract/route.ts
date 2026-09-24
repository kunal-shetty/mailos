import { NextRequest, NextResponse } from 'next/server'
import { extractActions } from '@/lib/groq'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subject, body, sender } = await req.json()
  const result = await extractActions({ subject: subject ?? '', body: body ?? '', sender: sender ?? '' })
  return NextResponse.json(result)
}
