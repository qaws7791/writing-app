import { createHttpWritingAppApi } from "@/shared/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/shared/http/writing-app-api-port"
import {
  readBrowserApiBaseUrl,
  type BrowserApiBaseUrl,
} from "@/shared/config/runtime-config"

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
