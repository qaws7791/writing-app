import type { Context, MiddlewareHandler } from "hono"
import { timeout } from "hono/timeout"

import type { AppEnv, AppUseCases } from "./app-env"
import { errorToResponse } from "./http/error-response"
import type { ApiLogger } from "./observability/logger"

type ApiErrorResult = ReturnType<typeof errorToResponse>
type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500

function resolveRequestLogger(
  context: Context<AppEnv>,
  logger: ApiLogger
): ApiLogger {
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
  requestLogger: ApiLogger,
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
          error,
          status: response.status,
          ...extra,
        }

  if (response.status >= 500) {
    requestLogger.error(logPayload, message)
    return
  }

  requestLogger.warn(logPayload, message)
}

const AI_TIMEOUT_MS = 30_000
const DEFAULT_TIMEOUT_MS = 60_000

function throwTimeoutError(): never {
  const error = new Error("요청 시간이 초과되었습니다.")
  error.name = "TimeoutError"
  throw error
}

export function handleRequestError(
  c: Context<AppEnv>,
  error: unknown,
  logger: ApiLogger,
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
    c.set("aiUseCases", useCases.aiUseCases)
    c.set("authHandler", useCases.authHandler)
    c.set("autosaveWritingUseCase", useCases.autosaveWritingUseCase)
    c.set("createWritingUseCase", useCases.createWritingUseCase)
    c.set("deleteWritingUseCase", useCases.deleteWritingUseCase)
    c.set("getHomeUseCase", useCases.getHomeUseCase)
    c.set("getPromptUseCase", useCases.getPromptUseCase)
    c.set("getVersionUseCase", useCases.getVersionUseCase)
    c.set("getWritingUseCase", useCases.getWritingUseCase)
    c.set("listPromptsUseCase", useCases.listPromptsUseCase)
    c.set("listVersionsUseCase", useCases.listVersionsUseCase)
    c.set("listWritingsUseCase", useCases.listWritingsUseCase)
    c.set("pullDocumentUseCase", useCases.pullDocumentUseCase)
    c.set("pushTransactionsUseCase", useCases.pushTransactionsUseCase)
    c.set("readLatestAuthEmail", useCases.readLatestAuthEmail)
    c.set("savePromptUseCase", useCases.savePromptUseCase)
    c.set("sqliteVersion", useCases.sqliteVersion)
    c.set("unsavePromptUseCase", useCases.unsavePromptUseCase)
    return next()
  }
}

export function createTimeoutMiddleware(): MiddlewareHandler<AppEnv> {
  return (c, next) => {
    const ms = c.req.path.startsWith("/ai/")
      ? AI_TIMEOUT_MS
      : DEFAULT_TIMEOUT_MS
    return timeout(ms, throwTimeoutError)(c, next)
  }
}
