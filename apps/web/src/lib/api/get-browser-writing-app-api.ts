import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export function getBrowserWritingAppApi({
  apiBaseUrl = process.env["NEXT_PUBLIC_API_BASE_URL"] ??
    "http://localhost:3001",
  tokenProvider,
}: {
  readonly apiBaseUrl?: string
  readonly tokenProvider: () => Promise<string | null> | string | null
}): WritingAppApi {
  return createHttpWritingAppApi({
    baseUrl: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
    tokenProvider,
  })
}
