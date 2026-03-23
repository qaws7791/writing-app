import createClient from "openapi-fetch"

import type { paths } from "@/foundation/api/schema"
import { resolveBrowserApiBaseUrl } from "@/lib/api-base-url"
import { env } from "@/env"

function resolveBaseUrl(explicitBaseUrl?: string): string {
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "")
  }

  const envBaseUrl = env.NEXT_PUBLIC_API_BASE_URL
  if (!envBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required.")
  }

  return resolveBrowserApiBaseUrl(envBaseUrl)
}

export type ApiClient = ReturnType<typeof createApiClient>

export function createApiClient(options?: { baseUrl?: string }) {
  const baseUrl = resolveBaseUrl(options?.baseUrl)

  return createClient<paths>({
    baseUrl,
    credentials: "include",
  })
}
