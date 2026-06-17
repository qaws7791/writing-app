import type { MiddlewareHandler } from "hono"

import type { RequestLogger } from "@workspace/logger/request-logger"

export type RequestLoggingMiddlewareOptions = {
  readonly createRequestId?: () => string
  readonly logRequest: RequestLogger
  readonly readMonotonicTimeMs?: () => number
}

export type RequestLoggingRuntime = {
  readonly createRequestId: () => string
  readonly readMonotonicTimeMs: () => number
}

export const defaultRequestLoggingRuntime = {
  createRequestId: createDefaultRequestId,
  readMonotonicTimeMs: readDefaultMonotonicTimeMs,
} as const satisfies RequestLoggingRuntime

export function createRequestLoggingMiddleware({
  createRequestId = defaultRequestLoggingRuntime.createRequestId,
  logRequest,
  readMonotonicTimeMs = defaultRequestLoggingRuntime.readMonotonicTimeMs,
}: RequestLoggingMiddlewareOptions): MiddlewareHandler {
  return async (context, next) => {
    const startedAt = readMonotonicTimeMs()
    const requestId = context.req.header("x-request-id") ?? createRequestId()

    context.header("x-request-id", requestId)

    try {
      await next()
    } finally {
      logRequest({
        durationMs: Math.max(0, Math.round(readMonotonicTimeMs() - startedAt)),
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

function readDefaultMonotonicTimeMs(): number {
  return performance.now()
}
