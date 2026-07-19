import {
  createAdminHttpTransport,
  type AdminHttpTransport,
} from "@/shared/http/admin-http-transport"
import {
  readAdminWebOrigin,
  readServerApiBaseUrl,
} from "@/server/env/admin-runtime-config"
import type { ApiBaseUrl } from "@/shared/config/api-base-url"

export function getServerAdminHttpTransport({
  apiBaseUrl = readServerApiBaseUrl(),
  tokenProvider,
}: {
  readonly apiBaseUrl?: ApiBaseUrl
  readonly tokenProvider: () => Promise<string | null> | string | null
}): AdminHttpTransport {
  return createAdminHttpTransport({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    requestOrigin: readAdminWebOrigin(),
    tokenProvider,
  })
}
