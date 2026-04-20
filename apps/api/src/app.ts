import type { Context, MiddlewareHandler } from "hono"
import { timeout } from "hono/timeout"
import type { AppLogger } from "@workspace/logging"

import type { AppEnv, AppUseCases, AppVariables } from "./app-env"
import { errorToResponse } from "./http/error-response"
import { TimeoutError } from "./http/timeout-error"

type ApiErrorResult = ReturnType<typeof errorToResponse>
type ApiErrorStatus = 400 | 401 | 403 | 404 | 408 | 409 | 422 | 429 | 500

function resolveRequestLogger(
  context: Context<AppEnv>,
  logger: AppLogger
): AppLogger {
  const requestLogger = context.get("requestLogger")

  if (requestLogger) {
    return requestLogger
  }

  return logger.child({
    method: context.req.method,
    path: context.req.path,
    requestId: context.get("requestId"),
    scope: "http",
  })
}

function logRequestFailure(
  requestLogger: AppLogger,
  error: unknown,
  response: ApiErrorResult,
  message: string,
  extra?: Record<string, unknown>
) {
  const logPayload =
    error instanceof Error
      ? {
          code: response.body.error.code,
          err: error,
          status: response.status,
          ...extra,
        }
      : {
          code: response.body.error.code,
          cause: error,
          status: response.status,
          ...extra,
        }

  if (response.status >= 500) {
    requestLogger.error(logPayload, message)
    return
  }

  requestLogger.warn(logPayload, message)
}

const DEFAULT_TIMEOUT_MS = 60_000

export function handleRequestError(
  c: Context<AppEnv>,
  error: unknown,
  logger: AppLogger,
  message: string
) {
  const response = errorToResponse(error)
  const requestLogger = resolveRequestLogger(c, logger)
  const requestId = (c.get("requestId") ?? undefined) as string | undefined
  const userId = (c.get("userId") ?? undefined) as string | undefined

  logRequestFailure(
    requestLogger,
    error,
    response,
    message,
    userId ? { userId } : undefined
  )

  if (response.status >= 500 && requestId) {
    response.body.error.requestId = requestId
  }

  return c.json(response.body, response.status as ApiErrorStatus)
}

export function createUseCaseMiddleware(
  useCases: AppUseCases
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    for (const [key, value] of Object.entries(useCases) as [
      keyof AppVariables,
      AppVariables[keyof AppVariables],
    ][]) {
      c.set(key, value)
    }
    return next()
  }
}

export function createTimeoutMiddleware(): MiddlewareHandler<AppEnv> {
  return timeout(DEFAULT_TIMEOUT_MS, () => {
    throw new TimeoutError()
  })
}
