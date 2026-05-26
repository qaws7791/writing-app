import createClient from "openapi-fetch"

import type { paths } from "@/lib/api/generated/writing-app-api"

export type ApiFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export interface CreateOpenApiClientInput {
  baseUrl: string
  fetch?: ApiFetch
  headers?: HeadersInit
}

export function createOpenApiClient(input: CreateOpenApiClientInput) {
  return createClient<paths>({
    baseUrl: input.baseUrl,
    credentials: "include",
    fetch: input.fetch,
    headers: input.headers,
  })
}
