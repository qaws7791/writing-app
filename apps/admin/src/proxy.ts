import { NextResponse, type NextRequest } from "next/server"

import { createContentSecurityPolicy } from "@workspace/config/nextjs/security-headers"
import { readAdminCspRuntimeConfig } from "@/runtime-config-server"
import { adminRequestPathHeader } from "@/lib/auth/admin-request-path"

export function proxy(request: NextRequest) {
  const runtime = readAdminCspRuntimeConfig()
  const nonce = crypto.randomUUID()
  const policy = createContentSecurityPolicy({
    allowHttpsImages: true,
    connectSources: createAdminApiConnectSources(runtime.apiOrigin),
    development: runtime.development,
    nonce,
  })

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("Content-Security-Policy", policy)
  requestHeaders.set(
    adminRequestPathHeader,
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  )
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

function createAdminApiConnectSources(
  apiOrigin: string | undefined
): readonly string[] {
  if (apiOrigin === undefined) {
    return []
  }

  const httpOrigin = new URL(apiOrigin).origin
  const webSocketUrl = new URL(httpOrigin)
  webSocketUrl.protocol = webSocketUrl.protocol === "https:" ? "wss:" : "ws:"
  return [httpOrigin, webSocketUrl.origin]
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
