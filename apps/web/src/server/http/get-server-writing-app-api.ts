import "server-only"

import { createHttpWritingAppApi } from "@/shared/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/shared/http/writing-app-api-port"
import type { ServerApiBaseUrl } from "@/shared/config/api-base-url"
import { readServerApiBaseUrl } from "@/server/env/runtime-config"

export function getServerWritingAppApi({
  apiBaseUrl = readServerApiBaseUrl(),
  tokenProvider,
}: {
  readonly apiBaseUrl?: ServerApiBaseUrl
  readonly tokenProvider: () => Promise<string | null> | string | null
}): WritingAppApi {
  return createHttpWritingAppApi({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    tokenProvider,
  })
}
