import { type NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE_NAME } from "@/foundation/auth/constants"

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
