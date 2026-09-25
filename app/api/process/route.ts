import { NextRequest, NextResponse } from 'next/server'
import { sanitizeCategories } from '@/lib/categories'
import { processInbox } from '@/lib/pipeline'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await req.json().catch(() => ({}))
  const categories = sanitizeCategories(payload?.categories)

  try {
    const result = await processInbox(session, categories)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Process failed' },
      { status: 500 },
    )
  }
}
