import { NextRequest, NextResponse } from 'next/server'
import { appUrl, setSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/?error=oauth', appUrl()))

  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    redirect_uri: `${appUrl()}/api/auth/callback`,
    grant_type: 'authorization_code',
  })

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!tokenRes.ok) return NextResponse.redirect(new URL('/?error=token', appUrl()))
  const tokens = await tokenRes.json()

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const profile = userRes.ok ? await userRes.json() : {}

  await setSession({
    mode: 'google',
    email: profile.email ?? 'gmail-user',
    name: profile.name ?? 'You',
    picture: profile.picture,
    accessToken: tokens.access_token,
  })

  return NextResponse.redirect(new URL('/dashboard', appUrl()))
}
