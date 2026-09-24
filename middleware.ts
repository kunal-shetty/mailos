import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const session = req.cookies.get('mailos_session')?.value
  const protectedPath =
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/actions') ||
    req.nextUrl.pathname.startsWith('/email')

  if (protectedPath && !session) {
    return NextResponse.redirect(new URL('/', req.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/actions/:path*', '/email/:path*'],
}
