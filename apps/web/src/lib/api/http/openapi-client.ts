import { apiFailure, apiOk, type ApiResult } from "@/lib/api/api-result"
import {
  contractApiError,
  networkApiError,
  toApiError,
} from "@/lib/api/api-error"
import { learnerSessionCookieName } from "@/lib/auth/session-token"
import { buildApiUrl, type BrowserApiBaseUrl } from "@/runtime-config"
import type { ServerApiBaseUrl } from "@/runtime-config-server"
import {
  fetchHttpResponse,
  type HttpFetch,
  type HttpNetworkError,
} from "@workspace/http-client"

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
  readonly baseUrl: BrowserApiBaseUrl | ServerApiBaseUrl
  readonly fetch: FetchLike
  readonly reportNetworkError?: NetworkErrorReporter
  readonly tokenProvider: TokenProvider
}): OpenApiClient {
  return {
    async requestJson<TValue>(input: {
      readonly body?: unknown
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

      const request = new Request(buildApiUrl(baseUrl, input.path), {
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        credentials: "include",
        headers,
        method: input.method,
      })
      const fetchResult = await fetchJson(request, fetch, reportNetworkError)

      if (fetchResult.kind === "network-error") {
        return apiFailure(networkApiError(fetchResult.error))
      }

      const { response } = fetchResult
      const bodyResult = await readJson(response)

      if (bodyResult.kind === "err") {
        return apiFailure(contractApiError(response.status))
      }

      if (!response.ok) {
        return apiFailure(toApiError(response.status, bodyResult.value))
      }

      const parsedBody = input.schema.safeParse(bodyResult.value)

      if (!parsedBody.success) {
        return apiFailure(contractApiError(response.status))
      }

      return apiOk(parsedBody.data)
    },
  }
}

async function fetchJson(
  request: Request,
  fetch: FetchLike,
  reportNetworkError: NetworkErrorReporter | undefined
): ReturnType<typeof fetchHttpResponse> {
  const result = await fetchHttpResponse(request, fetch)

  if (result.kind === "network-error") {
    reportNetworkError?.({
      error: result.error,
      request,
    })
  }

  return result
}

async function readJson(response: Response): Promise<
  | {
      readonly kind: "ok"
      readonly value: unknown
    }
  | {
      readonly kind: "err"
    }
> {
  const text = await response.text()

  if (text.length === 0) {
    return {
      kind: "ok",
      value: null,
    }
  }

  try {
    return {
      kind: "ok",
      value: JSON.parse(text) as unknown,
    }
  } catch {
    return {
      kind: "err",
    }
  }
}
