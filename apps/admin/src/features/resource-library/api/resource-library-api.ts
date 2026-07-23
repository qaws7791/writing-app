"use client"

import { createResourceLibraryHttpAdapter } from "@/features/resource-library/api/resource-library-http-adapter"
import { createAdminHttpTransport } from "@/shared/http/admin-http-transport"

export function createBrowserResourceLibraryApi() {
  return createResourceLibraryHttpAdapter(
    createAdminHttpTransport({
      fetch: globalThis.fetch.bind(globalThis),
      tokenProvider: () => null,
    })
  )
}
