import type { MiddlewareHandler } from "hono"
import { bodyLimit } from "hono/body-limit"
import { errorJson } from "#http-platform/errors/error-response"

const defaultApiRequestBodyLimitBytes = 1024 * 1024

export function createRequestBodyLimitMiddleware({
  maxSize = defaultApiRequestBodyLimitBytes,
}: {
  readonly maxSize?: number
} = {}): MiddlewareHandler {
  return bodyLimit({
    maxSize,
    onError: (context) => {
      const requestId = readRequestId(context.get("requestId"))
      const response = errorJson(
        {
          code: "PAYLOAD_TOO_LARGE",
          message: "Payload Too Large",
          requestId,
        },
        413
      )
      response.headers.set("x-request-id", requestId)
      return response
    },
  })
}

function readRequestId(value: unknown): string {
  return typeof value === "string" && value.length > 0
    ? value
    : crypto.randomUUID()
}
