import { cookies } from 'next/headers'
import type { SessionUser } from '@/types'

const COOKIE = 'mailos_session'

export async function getSession(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as SessionUser
  } catch {
    return null
  }
}

export async function setSession(user: SessionUser) {
  const value = Buffer.from(JSON.stringify(user), 'utf8').toString('base64url')
  ;(await cookies()).set(COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSession() {
  ;(await cookies()).delete(COOKIE)
}

export function appUrl() {
  return process.env.APP_URL ?? 'http://localhost:3000'
}
