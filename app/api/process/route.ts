import { NextResponse } from 'next/server'
import { processInbox } from '@/lib/pipeline'
import { getSession } from '@/lib/session'

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await processInbox(session)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Process failed' },
      { status: 500 },
    )
  }
}
