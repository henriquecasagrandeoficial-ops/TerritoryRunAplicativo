import { NextResponse } from 'next/server'

import { auth } from '@/auth'

export default auth((req) => {
  const path = req.nextUrl.pathname
  if (path.startsWith('/mapa') && !req.auth) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/mapa/:path*'],
}
