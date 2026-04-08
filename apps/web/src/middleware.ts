import { type NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE_NAME = "better-auth.session_token"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME)

  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/"],
}
