import { NextResponse, type NextRequest } from "next/server"

import { createContentSecurityPolicy } from "@workspace/nextjs-config/security-headers"
import { createLoginPagePath } from "@/features/authentication/model/auth-navigation"
import { readWebCspRuntimeConfig } from "@/server/env/runtime-config"
import { readLearnerSessionTokenFromCookieHeader } from "@workspace/auth/session-token"

export function proxy(request: NextRequest) {
  const loginRedirect = createLearnerLoginRedirect(request)
  if (loginRedirect !== null) {
    return NextResponse.redirect(loginRedirect)
  }

  const runtime = readWebCspRuntimeConfig()
  const nonce = crypto.randomUUID()
  const policy = createContentSecurityPolicy({
    connectSources: [runtime.apiOrigin],
    development: runtime.development,
    imageSources: [
      "https://lh3.googleusercontent.com",
      "https://images.googleusercontent.com",
    ],
    nonce,
  })

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("Content-Security-Policy", policy)
  requestHeaders.set("x-nonce", nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set(
    runtime.reportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy",
    policy
  )
  return response
}

function createLearnerLoginRedirect(request: NextRequest): null | URL {
  const { pathname, search } = request.nextUrl
  const protectedRoute = pathname === "/app" || pathname.startsWith("/app/")
  if (!protectedRoute) return null

  const sessionToken = readLearnerSessionTokenFromCookieHeader(
    request.headers.get("cookie")
  )
  if (sessionToken !== null) return null

  return new URL(createLoginPagePath(`${pathname}${search}`), request.url)
}

export const config = {
  matcher: [
    {
      missing: [
        { key: "next-router-prefetch", type: "header" },
        { key: "purpose", type: "header", value: "prefetch" },
      ],
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
    },
  ],
}
