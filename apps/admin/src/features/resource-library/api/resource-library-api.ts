"use client"

import { createResourceLibraryHttpAdapter } from "@/features/resource-library/api/resource-library-http-adapter"
import { createAdminHttpTransport } from "@/shared/http/admin-http-transport"
import type { ApiBaseUrl } from "@/shared/config/api-base-url"

export function createBrowserResourceLibraryApi(apiBaseUrl: ApiBaseUrl) {
  return createResourceLibraryHttpAdapter(
    createAdminHttpTransport({
      baseUrl: apiBaseUrl,
      fetch: globalThis.fetch.bind(globalThis),
      tokenProvider: () => null,
    })
  )
}
