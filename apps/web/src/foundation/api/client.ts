import { createApiClient as createPackageClient } from "@workspace/api-client"

import { resolveBrowserApiBaseUrl } from "@/lib/api-base-url"
import { env } from "@/env"

export type { ApiClient } from "@workspace/api-client"

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

export function createApiClient(options?: { baseUrl?: string }) {
  const baseUrl = resolveBaseUrl(options?.baseUrl)
  return createPackageClient({ baseUrl })
}
