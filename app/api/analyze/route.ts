import { NextRequest, NextResponse } from 'next/server'
import { sanitizeCategories } from '@/lib/categories'
import { classifyEmail } from '@/lib/jev'
import { extractActions, summarizeEmail } from '@/lib/groq'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await req.json().catch(() => ({}))
  const subject = typeof payload.subject === 'string' ? payload.subject : ''
  const body = typeof payload.body === 'string' ? payload.body : ''
  const sender = typeof payload.sender === 'string' ? payload.sender : ''

  if (!body.trim()) {
    return NextResponse.json({ error: 'Missing email body' }, { status: 400 })
  }

  const categories = sanitizeCategories(payload.categories)

  try {
    const input = { subject, body, sender, categories }
    const [jev, groq, summary] = await Promise.all([
      classifyEmail(input),
      extractActions(input),
      summarizeEmail(input),
    ])

    return NextResponse.json({
      jev,
      groq,
      summary: summary.summary,
      highlights: summary.highlights,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 },
    )
  }
}
