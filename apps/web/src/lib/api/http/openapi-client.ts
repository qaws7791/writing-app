import { apiFailure, apiOk, type ApiResult } from "@/lib/api/api-result"
import { networkApiError, toApiError } from "@/lib/api/api-error"

export type FetchLike = (request: Request) => Promise<Response>

export type TokenProvider = () => Promise<string | null> | string | null

export type OpenApiClient = {
  readonly requestJson: <TValue>(input: {
    readonly body?: unknown
    readonly method: "GET" | "POST"
    readonly path: string
  }) => Promise<ApiResult<TValue>>
}

export function createOpenApiClient({
  baseUrl,
  fetch,
  tokenProvider,
}: {
  readonly baseUrl: string
  readonly fetch: FetchLike
  readonly tokenProvider: TokenProvider
}): OpenApiClient {
  return {
    async requestJson<TValue>(input: {
      readonly body?: unknown
      readonly method: "GET" | "POST"
      readonly path: string
    }) {
      const headers = new Headers()
      const token = await tokenProvider()

      if (token !== null) {
        headers.set("Authorization", `Bearer ${token}`)
      }

      if (input.body !== undefined) {
        headers.set("Content-Type", "application/json")
      }

      try {
        const response = await fetch(
          new Request(toApiUrl(baseUrl, input.path), {
            body:
              input.body === undefined ? undefined : JSON.stringify(input.body),
            headers,
            method: input.method,
          })
        )
        const body = await readJson(response)

        if (!response.ok) {
          return apiFailure(toApiError(response.status, body))
        }

        return apiOk(body as TValue)
      } catch {
        return apiFailure(networkApiError())
      }
    },
  }
}

function toApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()

  if (text.length === 0) {
    return null
  }

  return JSON.parse(text)
}
