import { apiFailure, apiOk, type ApiResult } from "@/lib/api/api-result"
import {
  contractApiError,
  networkApiError,
  toApiError,
} from "@/lib/api/api-error"

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

export type FetchLike = (request: Request) => Promise<Response>

export type TokenProvider = () => Promise<string | null> | string | null

export type NetworkErrorReporter = (event: {
  readonly error: unknown
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
  readonly baseUrl: string
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
        headers.set("Authorization", `Bearer ${token}`)
      }

      if (input.body !== undefined) {
        headers.set("Content-Type", "application/json")
      }

      const request = new Request(toApiUrl(baseUrl, input.path), {
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        headers,
        method: input.method,
      })
      const response = await fetchJson(request, fetch, reportNetworkError)

      if (response === null) {
        return apiFailure(networkApiError())
      }

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

function toApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
}

async function fetchJson(
  request: Request,
  fetch: FetchLike,
  reportNetworkError: NetworkErrorReporter | undefined
): Promise<Response | null> {
  try {
    return await fetch(request)
  } catch (error) {
    reportNetworkError?.({
      error,
      request,
    })

    return null
  }
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
