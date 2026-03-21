import type { MiddlewareHandler } from "hono"

import type { ApiVariables } from "../app-variables.js"
import { toErrorResponse } from "../http/errors.js"
import type { ApiLogger } from "../logger.js"

export function createRequestLoggerMiddleware(
  logger: ApiLogger
): MiddlewareHandler<{ Variables: ApiVariables }> {
  return async (context, next) => {
    const startedAt = Date.now()
    const requestId =
      context.req.header("x-request-id")?.trim() ?? crypto.randomUUID()
    const requestLogger = logger.child({
      method: context.req.method,
      path: context.req.path,
      requestId,
      scope: "http",
    })

    context.set("requestId", requestId)
    context.set("requestLogger", requestLogger)
    context.header("x-request-id", requestId)
    requestLogger.info("request started")

    let responseStatus = 500

    try {
      await next()
      responseStatus = context.res.status
    } catch (error) {
      responseStatus = toErrorResponse(error).status
      throw error
    } finally {
      requestLogger.info(
        {
          durationMs: Date.now() - startedAt,
          status: responseStatus,
        },
        "request completed"
      )
    }
  }
}
