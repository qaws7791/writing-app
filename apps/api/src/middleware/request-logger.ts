import type { MiddlewareHandler } from "hono"

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@workspace/core"

import type { AppEnv } from "../app-env"
import type { ApiLogger } from "../observability/logger"
import { UnauthorizedError } from "../http/unauthorized-error"

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
  if (error instanceof ValidationError) return 400
  if (error instanceof UnauthorizedError) return 401
  if (error instanceof ForbiddenError) return 403
  if (error instanceof NotFoundError) return 404
  if (error instanceof ConflictError) return 409
  return 500
}
