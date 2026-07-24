import { NextResponse, type NextRequest } from "next/server"

import { createContentSecurityPolicy } from "@workspace/nextjs-config/security-headers"
import { readAdminCspRuntimeConfig } from "@/server/env/admin-runtime-config"
import { adminRequestPathHeader } from "@/shared/auth/admin-request-path"

export function proxy(request: NextRequest) {
  const runtime = readAdminCspRuntimeConfig()
  const nonce = crypto.randomUUID()
  const policy = createContentSecurityPolicy({
    development: runtime.development,
    imageSources:
      runtime.contentAssetImageSource === null
        ? []
        : [runtime.contentAssetImageSource],
    nonce,
    upgradeInsecureRequests: runtime.upgradeInsecureRequests,
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
