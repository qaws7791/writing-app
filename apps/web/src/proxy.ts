import { NextResponse, type NextRequest } from "next/server"

import { createContentSecurityPolicy } from "@workspace/config/nextjs/security-headers"
import { readWebCspRuntimeConfig } from "@/runtime-config-server"

export function proxy(request: NextRequest) {
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
