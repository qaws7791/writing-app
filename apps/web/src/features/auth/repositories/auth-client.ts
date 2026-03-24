"use client"

import { createAuthClient } from "better-auth/react"

import { env } from "@/foundation/config/env"
import { resolveBrowserApiBaseUrl } from "@/foundation/lib/api-base-url"

function resolveAuthBaseUrl(): string {
  const apiBaseUrl = env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3010"

  return `${resolveBrowserApiBaseUrl(apiBaseUrl)}/api/auth`
}

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL: resolveAuthBaseUrl(),
    fetchOptions: {
      credentials: "include",
    },
  }
)
