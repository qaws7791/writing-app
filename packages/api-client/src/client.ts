import createClient from "openapi-fetch"

import type { paths } from "./schema"

export type ApiClient = ReturnType<typeof createApiClient>

export function createApiClient(options: { baseUrl: string }) {
  return createClient<paths>({
    baseUrl: options.baseUrl,
    credentials: "include",
  })
}
