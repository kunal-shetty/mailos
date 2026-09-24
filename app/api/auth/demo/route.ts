import { NextResponse } from 'next/server'
import { demoUser } from '@/lib/demo-data'
import { appUrl, setSession } from '@/lib/session'

export async function GET() {
  await setSession(demoUser)
  return NextResponse.redirect(new URL('/dashboard', appUrl()))
}
