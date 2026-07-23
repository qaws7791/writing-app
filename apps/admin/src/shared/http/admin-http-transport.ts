import {
  contractAdminApiError,
  networkAdminApiError,
  toAdminApiError,
} from "@/shared/http/admin-api-error"
import type { AdminApiResult } from "@/shared/http/admin-api-result"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { buildApiUrl, type ApiBaseUrl } from "@/shared/config/api-base-url"
import {
  fetchHttpResponse,
  requestHttpJson,
  type HttpFetch,
} from "@workspace/http-client/json-transport"
import { httpApiFailure, httpApiOk } from "@workspace/http-client/api-result"

type AdminResponseSchema<TValue> = {
  readonly safeParse: (
    value: unknown
  ) =>
    | { readonly data: TValue; readonly success: true }
    | { readonly success: false }
}

type AdminHttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT"
export type AdminTokenProvider = () => Promise<string | null> | string | null

type AdminDownload = {
  readonly body: string
  readonly fileName: string
}

export type AdminHttpTransport = {
  readonly requestDownload: (input: {
    readonly contentType: string
    readonly path: string
  }) => Promise<AdminApiResult<AdminDownload>>
  readonly requestJson: <TValue>(input: {
    readonly body?: unknown
    readonly headers?: Readonly<Record<string, string>>
    readonly method: AdminHttpMethod
    readonly path: string
    readonly schema: AdminResponseSchema<TValue>
  }) => Promise<AdminApiResult<TValue>>
}

export function createAdminHttpTransport({
  baseUrl,
  fetch,
  requestOrigin,
  tokenProvider,
}: {
  readonly baseUrl?: ApiBaseUrl
  readonly fetch: HttpFetch
  readonly requestOrigin?: string
  readonly tokenProvider: AdminTokenProvider
}): AdminHttpTransport {
  return {
    async requestDownload(input) {
      const request = await createRequest({
        ...(baseUrl === undefined ? {} : { baseUrl }),
        method: "GET",
        path: input.path,
        ...(requestOrigin === undefined ? {} : { requestOrigin }),
        tokenProvider,
      })
      const result = await fetchHttpResponse(request, fetch)

      if (result.kind === "network-error") {
        return httpApiFailure(networkAdminApiError(result.error))
      }
      if (!result.response.ok) {
        const body = await readJson(result.response)
        return body.kind === "ok"
          ? httpApiFailure(toAdminApiError(result.response.status, body.value))
          : httpApiFailure(contractAdminApiError(result.response.status))
      }

      const fileName = readDownloadFileName(result.response, input.contentType)
      if (fileName === null) {
        return httpApiFailure(contractAdminApiError(result.response.status))
      }

      return httpApiOk({ body: await result.response.text(), fileName })
    },
    async requestJson(input) {
      const request = await createRequest({
        ...(baseUrl === undefined ? {} : { baseUrl }),
        ...(input.body === undefined ? {} : { body: input.body }),
        ...(input.headers === undefined ? {} : { headers: input.headers }),
        method: input.method,
        path: input.path,
        ...(requestOrigin === undefined ? {} : { requestOrigin }),
        tokenProvider,
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
          return httpApiFailure(toAdminApiError(result.status, result.body))
        case "contract-error":
          return httpApiFailure(
            contractAdminApiError(result.status ?? undefined)
          )
        case "network-error":
          return httpApiFailure(networkAdminApiError(result.error))
      }
    },
  }
}

async function createRequest(input: {
  readonly baseUrl?: ApiBaseUrl
  readonly body?: unknown
  readonly headers?: Readonly<Record<string, string>>
  readonly method: AdminHttpMethod
  readonly path: string
  readonly requestOrigin?: string
  readonly tokenProvider: AdminTokenProvider
}): Promise<Request> {
  const headers = new Headers(input.headers)
  const token = await input.tokenProvider()

  if (token !== null) {
    headers.set(
      "Cookie",
      `${adminSessionCookieName}=${encodeURIComponent(token)}`
    )
  }
  if (input.requestOrigin !== undefined) {
    headers.set("Origin", new URL(input.requestOrigin).origin)
  }
  if (input.body !== undefined) headers.set("Content-Type", "application/json")

  return new Request(buildApiUrl(input.baseUrl, input.path), {
    ...(input.body === undefined ? {} : { body: JSON.stringify(input.body) }),
    credentials: "include",
    headers,
    method: input.method,
  })
}

function readDownloadFileName(
  response: Response,
  expectedContentType: string
): string | null {
  const contentType = response.headers
    .get("Content-Type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase()
  const disposition = response.headers.get("Content-Disposition")
  const dispositionParts = disposition?.split(";").map((part) => part.trim())
  const encoded = dispositionParts
    ?.slice(1)
    .find((part) => /^filename\*\s*=/iu.test(part))
    ?.replace(/^filename\*\s*=\s*UTF-8''/iu, "")

  if (
    contentType !== expectedContentType.trim().toLowerCase() ||
    dispositionParts?.[0]?.toLowerCase() !== "attachment" ||
    encoded === undefined ||
    encoded.length === 0 ||
    !dispositionParts
      .slice(1)
      .some((part) => /^filename\*\s*=\s*UTF-8''/iu.test(part))
  ) {
    return null
  }

  try {
    const fileName = decodeURIComponent(encoded)
    return fileName.trim().length === 0 ? null : fileName
  } catch {
    return null
  }
}

async function readJson(
  response: Response
): Promise<
  { readonly kind: "ok"; readonly value: unknown } | { readonly kind: "error" }
> {
  const text = await response.text()
  if (text.length === 0) return { kind: "ok", value: null }

  try {
    return { kind: "ok", value: JSON.parse(text) as unknown }
  } catch {
    return { kind: "error" }
  }
}
