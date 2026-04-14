import { type NextRequest, NextResponse } from "next/server"

import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session"

const PUBLIC_PATHS = ["/login", "/api/auth/login"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const session = await verifySessionToken(token)
  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete(ADMIN_SESSION_COOKIE)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
