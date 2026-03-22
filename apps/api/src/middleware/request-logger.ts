import type { MiddlewareHandler } from "hono"

import type { AppEnv } from "../app-env"
import type { ApiLogger } from "../observability/logger"

export function createRequestLoggerMiddleware(
  logger: ApiLogger
): MiddlewareHandler<AppEnv> {
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
      responseStatus = toQuickStatus(error)
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

function toQuickStatus(error: unknown): number {
  if (error instanceof Error) {
    const name = error.name
    if (name === "ValidationError") return 400
    if (name === "UnauthorizedError") return 401
    if (name === "ForbiddenError") return 403
    if (name === "NotFoundError") return 404
    if (name === "ConflictError") return 409
  }

  return 500
}
