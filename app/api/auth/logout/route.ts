import { NextResponse } from 'next/server'
import { appUrl, clearSession } from '@/lib/session'

export async function GET() {
  await clearSession()
  return NextResponse.redirect(new URL('/', appUrl()))
}
