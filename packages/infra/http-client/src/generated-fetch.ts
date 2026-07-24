import type { ApiError } from "@workspace/contracts/api-error"

export type GeneratedApiAudience = "admin" | "learner"

export type GeneratedApiClientRuntime = Readonly<{
  baseUrl?: string
  cookie?: string | null
  fetch?: (request: Request) => Promise<Response>
}>

const generatedApiClientRuntime = Symbol("generated-api-client-runtime")

type GeneratedRequestInit = RequestInit & {
  [generatedApiClientRuntime]?: GeneratedApiClientRuntime
}

export type GeneratedApiClientErrorDetail =
  | Readonly<{
      kind: "aborted"
      method: string
      url: string
    }>
  | Readonly<{
      kind: "network"
      method: string
      url: string
    }>
  | Readonly<{
      error: ApiError
      kind: "http"
      retryAfterSeconds: number | null
      status: number
    }>
  | Readonly<{
      kind: "contract"
      reason:
        | "invalid-error-response"
        | "invalid-json-response"
        | "server-base-url-required"
      status: number | null
    }>

export class GeneratedApiClientError extends Error {
  readonly detail: GeneratedApiClientErrorDetail

  constructor(detail: GeneratedApiClientErrorDetail, cause?: unknown) {
    super(createErrorMessage(detail), { cause })
    this.name = "GeneratedApiClientError"
    this.detail = detail
  }
}

export function createGeneratedRequestOptions(
  runtime: GeneratedApiClientRuntime,
  options: RequestInit = {}
): RequestInit {
  const requestOptions: GeneratedRequestInit = {
    ...options,
    [generatedApiClientRuntime]: runtime,
  }
  return requestOptions
}

export function learnerFetch<T>(
  url: string,
  options: GeneratedRequestInit,
  runtime?: GeneratedApiClientRuntime
): Promise<T> {
  return executeGeneratedFetch<T>("learner", url, options, runtime)
}

export function adminFetch<T>(
  url: string,
  options: GeneratedRequestInit,
  runtime?: GeneratedApiClientRuntime
): Promise<T> {
  return executeGeneratedFetch<T>("admin", url, options, runtime)
}

async function executeGeneratedFetch<T>(
  audience: GeneratedApiAudience,
  url: string,
  options: GeneratedRequestInit,
  runtime: GeneratedApiClientRuntime | undefined
): Promise<T> {
  const { [generatedApiClientRuntime]: configuredRuntime, ...requestOptions } =
    options
  const resolvedRuntime = runtime ?? configuredRuntime

  const requestUrl = resolveRequestUrl(audience, url, resolvedRuntime?.baseUrl)
  const headers = new Headers(requestOptions.headers)
  if (
    resolvedRuntime?.cookie !== undefined &&
    resolvedRuntime.cookie !== null
  ) {
    if (!headers.has("cookie")) {
      headers.set("cookie", resolvedRuntime.cookie)
    }
  }

  const request = new Request(requestUrl, {
    ...requestOptions,
    credentials: requestOptions.credentials ?? "include",
    headers,
  })
  const requestMetadata = {
    method: request.method,
    url: redactUrl(request.url),
  }

  let response: Response
  try {
    response = await (resolvedRuntime?.fetch ?? defaultFetch)(request)
  } catch (cause) {
    throw new GeneratedApiClientError(
      {
        kind:
          request.signal.aborted || readErrorName(cause) === "AbortError"
            ? "aborted"
            : "network",
        ...requestMetadata,
      },
      cause
    )
  }

  const body = await readResponseBody(response)
  if (body.kind === "invalid-json") {
    throw new GeneratedApiClientError({
      kind: "contract",
      reason: "invalid-json-response",
      status: response.status,
    })
  }

  if (!response.ok) {
    const error = parseApiErrorResponse(body.value)
    if (error === null) {
      throw new GeneratedApiClientError({
        kind: "contract",
        reason: "invalid-error-response",
        status: response.status,
      })
    }

    throw new GeneratedApiClientError({
      error,
      kind: "http",
      retryAfterSeconds: parseRetryAfterSeconds(
        response.headers.get("retry-after")
      ),
      status: response.status,
    })
  }

  return body.value as T
}

type ApiErrorViolation = NonNullable<ApiError["violations"]>[number]

function parseApiErrorResponse(value: unknown): ApiError | null {
  if (!isRecord(value)) return null
  if (
    Object.keys(value).some(
      (key) =>
        key !== "code" &&
        key !== "message" &&
        key !== "requestId" &&
        key !== "violations"
    ) ||
    typeof value["code"] !== "string" ||
    !/^[A-Z][A-Z0-9_]*$/u.test(value["code"]) ||
    typeof value["message"] !== "string" ||
    typeof value["requestId"] !== "string" ||
    value["requestId"].length === 0
  ) {
    return null
  }

  const violations = value["violations"]
  if (violations === undefined) {
    return {
      code: value["code"],
      message: value["message"],
      requestId: value["requestId"],
    }
  }
  if (!Array.isArray(violations)) return null

  const parsedViolations: ApiErrorViolation[] = []
  for (const violation of violations) {
    const parsed = parseApiErrorViolation(violation)
    if (parsed === null) return null
    parsedViolations.push(parsed)
  }

  return {
    code: value["code"],
    message: value["message"],
    requestId: value["requestId"],
    violations: parsedViolations,
  }
}

function parseApiErrorViolation(value: unknown): ApiErrorViolation | null {
  if (!isRecord(value)) return null
  if (
    Object.keys(value).some(
      (key) => key !== "code" && key !== "message" && key !== "path"
    ) ||
    (value["code"] !== undefined && typeof value["code"] !== "string") ||
    typeof value["message"] !== "string" ||
    typeof value["path"] !== "string"
  ) {
    return null
  }

  return {
    ...(value["code"] === undefined ? {} : { code: value["code"] }),
    message: value["message"],
    path: value["path"],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function resolveRequestUrl(
  audience: GeneratedApiAudience,
  url: string,
  baseUrl: string | undefined
): string {
  if (isAbsoluteHttpUrl(url)) return url

  const path = resolveAudiencePath(audience, url)
  const normalizedBaseUrl = baseUrl?.trim().replace(/\/+$/u, "")
  if (normalizedBaseUrl !== undefined && normalizedBaseUrl.length > 0) {
    return `${normalizedBaseUrl}${path}`
  }
  if (typeof window !== "undefined") return path

  throw new GeneratedApiClientError({
    kind: "contract",
    reason: "server-base-url-required",
    status: null,
  })
}

function resolveAudiencePath(
  audience: GeneratedApiAudience,
  url: string
): string {
  const path = url.startsWith("/") ? url : `/${url}`
  const prefix = audience === "admin" ? "/api/admin" : "/api"
  return path === prefix || path.startsWith(`${prefix}/`)
    ? path
    : `${prefix}${path}`
}

async function readResponseBody(
  response: Response
): Promise<
  | Readonly<{ kind: "invalid-json" }>
  | Readonly<{ kind: "value"; value: unknown }>
> {
  const text = await response.text()
  if (text.length === 0) return { kind: "value", value: undefined }

  try {
    return { kind: "value", value: JSON.parse(text) as unknown }
  } catch {
    return { kind: "invalid-json" }
  }
}

function defaultFetch(request: Request): Promise<Response> {
  return globalThis.fetch(request)
}

function createErrorMessage(detail: GeneratedApiClientErrorDetail): string {
  switch (detail.kind) {
    case "aborted":
      return "API 요청이 중단되었습니다."
    case "contract":
      return "API 계약을 해석할 수 없습니다."
    case "http":
      return detail.error.message
    case "network":
      return "API에 연결할 수 없습니다."
  }
}

function parseRetryAfterSeconds(value: string | null): number | null {
  if (value === null || !/^\d+$/u.test(value)) return null
  return Number.parseInt(value, 10)
}

function readErrorName(cause: unknown): string | null {
  if (
    typeof cause === "object" &&
    cause !== null &&
    "name" in cause &&
    typeof cause.name === "string"
  ) {
    return cause.name
  }

  return null
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//iu.test(value)
}

function redactUrl(value: string): string {
  const url = new URL(value)
  url.hash = ""
  url.search = ""
  return url.toString()
}
