import type { MiddlewareHandler } from "hono"

import type { RequestLogger } from "@workspace/logger/request-logger"

export type RequestLoggingMiddlewareOptions = {
  readonly createRequestId?: () => string
  readonly logRequest: RequestLogger
}

export function createRequestLoggingMiddleware({
  createRequestId = createDefaultRequestId,
  logRequest,
}: RequestLoggingMiddlewareOptions): MiddlewareHandler {
  return async (context, next) => {
    const startedAt = performance.now()
    const requestId = context.req.header("x-request-id") ?? createRequestId()

    context.header("x-request-id", requestId)

    try {
      await next()
    } finally {
      logRequest({
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
        method: context.req.method,
        path: context.req.path,
        requestId,
        status: context.res.status,
      })
    }
  }
}

function createDefaultRequestId(): string {
  return crypto.randomUUID()
}
