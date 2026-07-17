import type { MiddlewareHandler } from "hono"
import { bodyLimit } from "hono/body-limit"

export const defaultApiRequestBodyLimitBytes = 1024 * 1024

export function createRequestBodyLimitMiddleware({
  maxSize = defaultApiRequestBodyLimitBytes,
}: {
  readonly maxSize?: number
} = {}): MiddlewareHandler {
  return bodyLimit({
    maxSize,
    onError: (context) =>
      context.json(
        {
          code: "PAYLOAD_TOO_LARGE",
          message: "Payload Too Large",
        },
        413
      ),
  })
}
