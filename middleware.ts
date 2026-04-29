import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|manifest.json|apple-touch-icon.png|icon-192.png|icon-512.png).*)',
  ],
}