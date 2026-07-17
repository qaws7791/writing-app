import {
  contractAdminApiError,
  networkAdminApiError,
  toAdminApiError,
} from "@/lib/api/api-error"
import type { AdminApiResult } from "@/lib/api/api-result"
import { adminSessionCookieName } from "@/lib/auth/admin-session-token"
import { buildAdminApiUrl, type AdminApiBaseUrl } from "@/runtime-config"
import {
  fetchHttpResponse,
  httpApiFailure,
  httpApiOk,
  type HttpFetch,
} from "@workspace/http-client"

export type AdminResponseSchema<TValue> = {
  readonly safeParse: (
    value: unknown
  ) =>
    | { readonly data: TValue; readonly success: true }
    | { readonly success: false }
}

export type AdminHttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT"
export type AdminTokenProvider = () => Promise<string | null> | string | null

export type AdminDownload = {
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
  readonly baseUrl: AdminApiBaseUrl
  readonly fetch: HttpFetch
  readonly requestOrigin?: string
  readonly tokenProvider: AdminTokenProvider
}): AdminHttpTransport {
  return {
    async requestDownload(input) {
      const request = await createRequest({
        baseUrl,
        method: "GET",
        path: input.path,
        requestOrigin,
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
        baseUrl,
        body: input.body,
        headers: input.headers,
        method: input.method,
        path: input.path,
        requestOrigin,
        tokenProvider,
      })
      const result = await fetchHttpResponse(request, fetch)

      if (result.kind === "network-error") {
        return httpApiFailure(networkAdminApiError(result.error))
      }

      const body = await readJson(result.response)
      if (body.kind === "error") {
        return httpApiFailure(contractAdminApiError(result.response.status))
      }
      if (!result.response.ok) {
        return httpApiFailure(
          toAdminApiError(result.response.status, body.value)
        )
      }

      const parsed = input.schema.safeParse(body.value)
      return parsed.success
        ? httpApiOk(parsed.data)
        : httpApiFailure(contractAdminApiError(result.response.status))
    },
  }
}

async function createRequest(input: {
  readonly baseUrl: AdminApiBaseUrl
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

  return new Request(buildAdminApiUrl(input.baseUrl, input.path), {
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
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
