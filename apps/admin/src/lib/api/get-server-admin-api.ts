import { createHttpAdminApi } from "@/lib/api/http-admin-api"
import type { AdminApi } from "@/lib/api/admin-api"
import { readAdminApiBaseUrl, type AdminApiBaseUrl } from "@/runtime-config"

export function getServerAdminApi({
  apiBaseUrl = readAdminApiBaseUrl(),
  tokenProvider,
}: {
  readonly apiBaseUrl?: AdminApiBaseUrl
  readonly tokenProvider: () => Promise<string | null> | string | null
}): AdminApi {
  return createHttpAdminApi({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    tokenProvider,
  })
}
