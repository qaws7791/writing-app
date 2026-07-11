import { createHttpAdminApi } from "@/lib/api/http-admin-api"
import type { AdminApi } from "@/lib/api/admin-api"
import {
  readAdminWebOrigin,
  readServerAdminApiBaseUrl,
} from "@/runtime-config-server"
import type { AdminApiBaseUrl } from "@/runtime-config"

export function getServerAdminApi({
  apiBaseUrl = readServerAdminApiBaseUrl(),
  tokenProvider,
}: {
  readonly apiBaseUrl?: AdminApiBaseUrl
  readonly tokenProvider: () => Promise<string | null> | string | null
}): AdminApi {
  return createHttpAdminApi({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    requestOrigin: readAdminWebOrigin(),
    tokenProvider,
  })
}
