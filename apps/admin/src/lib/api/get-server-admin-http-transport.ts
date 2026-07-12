import {
  createAdminHttpTransport,
  type AdminHttpTransport,
} from "@/lib/api/admin-http-transport"
import {
  readAdminWebOrigin,
  readServerAdminApiBaseUrl,
} from "@/runtime-config-server"
import type { AdminApiBaseUrl } from "@/runtime-config"

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
