import type { ApiResult } from "@/shared/http/api-result"
import {
  contractApiError,
  networkApiError,
  toApiError,
} from "@/shared/http/api-error"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import type { ApiBaseUrl } from "@/shared/config/api-base-url"
import { buildApiUrl } from "@/shared/config/runtime-config"
import {
  requestHttpJson,
  type HttpFetch,
  type HttpNetworkError,
} from "@workspace/http-client/json-transport"
import { httpApiFailure, httpApiOk } from "@workspace/http-client/api-result"

type ResponseSchema<TValue> = {
  readonly safeParse: (value: unknown) =>
    | {
        readonly data: TValue
        readonly success: true
      }
    | {
        readonly success: false
      }
}

export type FetchLike = HttpFetch

export type TokenProvider = () => Promise<string | null> | string | null

export type NetworkErrorReporter = (event: {
  readonly error: HttpNetworkError
  readonly request: Request
}) => void

export type OpenApiClient = {
  readonly requestJson: <TValue>(input: {
    readonly body?: unknown
    readonly headers?: Readonly<Record<string, string>>
    readonly method: "GET" | "POST"
    readonly path: string
    readonly schema: ResponseSchema<TValue>
  }) => Promise<ApiResult<TValue>>
}

export function createOpenApiClient({
  baseUrl,
  fetch,
  reportNetworkError,
  tokenProvider,
}: {
  readonly baseUrl: ApiBaseUrl
  readonly fetch: FetchLike
  readonly reportNetworkError?: NetworkErrorReporter
  readonly tokenProvider: TokenProvider
}): OpenApiClient {
  return {
    async requestJson<TValue>(input: {
      readonly body?: unknown
      readonly headers?: Readonly<Record<string, string>>
      readonly method: "GET" | "POST"
      readonly path: string
      readonly schema: ResponseSchema<TValue>
    }) {
      const headers = new Headers()
      const token = await tokenProvider()

      if (token !== null) {
        headers.set(
          "Cookie",
          `${learnerSessionCookieName}=${encodeURIComponent(token)}`
        )
      }

      if (input.body !== undefined) {
        headers.set("Content-Type", "application/json")
      }

      for (const [name, value] of Object.entries(input.headers ?? {})) {
        headers.set(name, value)
      }

      const request = new Request(buildApiUrl(baseUrl, input.path), {
        ...(input.body === undefined
          ? {}
          : { body: JSON.stringify(input.body) }),
        credentials: "include",
        headers,
        method: input.method,
      })
      const result = await requestHttpJson({
        fetch,
        request,
        schema: input.schema,
      })

      switch (result.kind) {
        case "success":
          return httpApiOk(result.value)
        case "http-error":
          return httpApiFailure(toApiError(result.status, result.body))
        case "contract-error":
          return httpApiFailure(contractApiError(result.status ?? undefined))
        case "network-error":
          reportNetworkError?.({ error: result.error, request })
          return httpApiFailure(networkApiError(result.error))
      }
    },
  }
}
