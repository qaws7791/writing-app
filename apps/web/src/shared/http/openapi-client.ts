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
  fetchHttpResponse,
  httpApiFailure,
  httpApiOk,
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
      const fetchResult = await fetchJson(request, fetch, reportNetworkError)

      if (fetchResult.kind === "network-error") {
        return httpApiFailure(networkApiError(fetchResult.error))
      }

      const { response } = fetchResult
      const bodyResult = await readJson(response)

      if (bodyResult.kind === "err") {
        return httpApiFailure(contractApiError(response.status))
      }

      if (!response.ok) {
        return httpApiFailure(toApiError(response.status, bodyResult.value))
      }

      const parsedBody = input.schema.safeParse(bodyResult.value)

      if (!parsedBody.success) {
        return httpApiFailure(contractApiError(response.status))
      }

      return httpApiOk(parsedBody.data)
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
