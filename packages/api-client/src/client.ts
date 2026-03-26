import createClient from "openapi-fetch"

import type { paths } from "./schema"

export type ApiClient = ReturnType<typeof createApiClient>

export function createApiClient(options: {
  baseUrl: string
  headers?: HeadersInit
}) {
  return createClient<paths>({
    baseUrl: options.baseUrl,
    credentials: "include",
    fetch: (request: Request) => {
      const headers = new Headers(options.headers)
      const requestHeaders = new Headers(request.headers)

      requestHeaders.forEach((value, key) => {
        headers.set(key, value)
      })

      return fetch(new Request(request, { headers }))
    },
  })
}
