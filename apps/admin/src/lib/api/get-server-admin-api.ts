import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import { createHttpAdminApi } from "@/lib/api/http-admin-api"
import type { AdminApi } from "@/lib/api/admin-api"

export function getServerAdminApi({
  apiBaseUrl = process.env["ADMIN_API_BASE_URL"] ??
    localRuntimeDefaults.adminApiBaseUrl,
  tokenProvider,
}: {
  readonly apiBaseUrl?: string
  readonly tokenProvider: () => Promise<string | null> | string | null
}): AdminApi {
  return createHttpAdminApi({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    tokenProvider,
  })
}
