import {
  createAdminHttpTransport,
  type AdminHttpTransport,
} from "@/shared/http/admin-http-transport"
import {
  readAdminWebOrigin,
  readServerAdminApiBaseUrl,
} from "@/server/env/admin-runtime-config"
import type { AdminApiBaseUrl } from "@/shared/config/admin-api-url"

export function getServerAdminHttpTransport({
  apiBaseUrl = readServerAdminApiBaseUrl(),
  tokenProvider,
}: {
  readonly apiBaseUrl?: AdminApiBaseUrl
  readonly tokenProvider: () => Promise<string | null> | string | null
}): AdminHttpTransport {
  return createAdminHttpTransport({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    requestOrigin: readAdminWebOrigin(),
    tokenProvider,
  })
}
