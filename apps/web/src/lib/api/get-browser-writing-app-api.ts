import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api-port"
import { readBrowserApiBaseUrl, type BrowserApiBaseUrl } from "@/runtime-config"

export function getBrowserWritingAppApi({
  apiBaseUrl = readBrowserApiBaseUrl(),
  tokenProvider,
}: {
  readonly apiBaseUrl?: BrowserApiBaseUrl
  readonly tokenProvider: () => Promise<string | null> | string | null
}): WritingAppApi {
  return createHttpWritingAppApi({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    tokenProvider,
  })
}
