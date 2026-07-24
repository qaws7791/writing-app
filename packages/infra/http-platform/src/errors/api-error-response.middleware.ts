import type { MiddlewareHandler } from "hono"
import { apiErrorSchema, type ApiError } from "@workspace/contracts/api-error"

type ApiErrorResponseMiddlewareOptions = Readonly<{
  exclude?: (path: string) => boolean
}>

export function createApiErrorResponseMiddleware(
  options: ApiErrorResponseMiddlewareOptions = {}
): MiddlewareHandler {
  return async (context, next) => {
    await next()

    if (
      context.res.status < 400 ||
      options.exclude?.(context.req.path) === true
    ) {
      return
    }

    const requestId = readRequestId(context.get("requestId"))
    context.res = await toCanonicalErrorResponse(context.res, requestId)
  }
}

async function toCanonicalErrorResponse(
  response: Response,
  requestId: string
): Promise<Response> {
  const value = await readJson(response)
  const parsed = apiErrorSchema.safeParse(value)
  const error: ApiError = parsed.success
    ? { ...parsed.data, requestId }
    : (readUpstreamError(value, requestId) ??
      createUnknownError(response.status, requestId))
  const headers = new Headers(response.headers)
  headers.set("Content-Type", "application/json")
  headers.set("x-request-id", requestId)

  return new Response(JSON.stringify(error), {
    headers,
    status: response.status,
  })
}

function readUpstreamError(value: unknown, requestId: string): ApiError | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("code" in value) ||
    !("message" in value) ||
    typeof value.code !== "string" ||
    !/^[A-Z][A-Z0-9_]*$/u.test(value.code) ||
    typeof value.message !== "string"
  ) {
    return null
  }

  return {
    code: value.code,
    message: value.message,
    requestId,
  }
}

function createUnknownError(status: number, requestId: string): ApiError {
  return {
    code: status >= 500 ? "INTERNAL_SERVER_ERROR" : "HTTP_ERROR",
    message:
      status >= 500
        ? "Internal Server Error"
        : "The request could not be completed",
    requestId,
  }
}

function readRequestId(value: unknown): string {
  return typeof value === "string" && value.length > 0
    ? value
    : crypto.randomUUID()
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.clone().json()
  } catch {
    return null
  }
}
