import { createApiClient as createPackageClient } from "@workspace/api-client"

import { resolveServerApiBaseUrl } from "@/foundation/lib/api-base-url"
import { env } from "@/foundation/config/env"

export type { ApiClient } from "@workspace/api-client"

export function createServerApiClient(input?: {
  baseUrl?: string
  requestHost?: string | null
}) {
  let baseUrl = input?.baseUrl

  if (!baseUrl) {
    const envBaseUrl = env.NEXT_PUBLIC_API_BASE_URL
    if (!envBaseUrl) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is required.")
    }
    baseUrl = resolveServerApiBaseUrl(envBaseUrl, input?.requestHost ?? null)
  }

  return createPackageClient({
    baseUrl: baseUrl.replace(/\/$/, ""),
  })
}
