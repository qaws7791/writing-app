import { createAuthClient } from "better-auth/react"

import { resolveSafeNextPath } from "@/lib/auth/auth-navigation"

export async function requestGoogleLogin(nextPath: string): Promise<void> {
  await createAuthClient({
    baseURL: getApiBaseUrl(),
  }).signIn.social({
    callbackURL: createCallbackUrl(nextPath),
    provider: "google",
  })
}

function createCallbackUrl(nextPath: string): string {
  const browserOrigin =
    typeof window === "undefined" ? "" : window.location.origin

  return new URL(resolveSafeNextPath(nextPath), browserOrigin).toString()
}

function getApiBaseUrl(): string {
  return (process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "").replace(/\/$/, "")
}
