import { createHttpWritingAppApi } from "@/shared/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/shared/http/writing-app-api-port"

export function getBrowserWritingAppApi({
  tokenProvider,
}: {
  readonly tokenProvider: () => Promise<string | null> | string | null
}): WritingAppApi {
  return createHttpWritingAppApi({
    fetch: globalThis.fetch.bind(globalThis),
    tokenProvider,
  })
}
