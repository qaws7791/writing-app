import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"
import {
  readServerApiBaseUrl,
  type ServerApiBaseUrl,
} from "@/runtime-config-server"

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
