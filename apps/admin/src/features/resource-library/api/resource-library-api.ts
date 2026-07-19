"use client"

import { createResourceLibraryHttpAdapter } from "@/features/resource-library/api/resource-library-http-adapter"
import { createAdminHttpTransport } from "@/shared/http/admin-http-transport"
import type { AdminApiBaseUrl } from "@/shared/config/admin-api-url"

export function createBrowserResourceLibraryApi(apiBaseUrl: AdminApiBaseUrl) {
  return createResourceLibraryHttpAdapter(
    createAdminHttpTransport({
      baseUrl: apiBaseUrl,
      fetch: globalThis.fetch.bind(globalThis),
      tokenProvider: () => null,
    })
  )
}
