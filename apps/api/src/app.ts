import { apiReference } from "@scalar/hono-api-reference"
import type { Context } from "hono"
import { cors } from "hono/cors"
import { timeout } from "hono/timeout"

import type { AppEnv, AppServices, GetSession } from "./app-env"
import { errorToResponse } from "./http/error-response"
import { createRouter } from "./http/create-router"
import type { ApiLogger } from "./observability/logger"
import { createRequestLoggerMiddleware } from "./middleware/request-logger"
import { createResolveSessionMiddleware } from "./middleware/resolve-session"
import authHandler from "./routes/auth/auth-handler"
import getAuthEmails from "./routes/dev/get-auth-emails"
import getAISuggestions from "./routes/ai/get-suggestions"
import getDocumentReview from "./routes/ai/get-document-review"
import getFlowReview from "./routes/ai/get-flow-review"
import autosaveWriting from "./routes/writings/autosave-writing"
import createWriting from "./routes/writings/create-writing"
import deleteWriting from "./routes/writings/delete-writing"
import getWriting from "./routes/writings/get-writing"
import listWritings from "./routes/writings/list-writings"
import getHealth from "./routes/health/get-health"
import getHome from "./routes/home/get-home"
import getPrompt from "./routes/prompts/get-prompt"
import listPrompts from "./routes/prompts/list-prompts"
import savePrompt from "./routes/prompts/save-prompt"
import unsavePrompt from "./routes/prompts/unsave-prompt"
import getSession from "./routes/session/get-session"
import pushTransactions from "./routes/writings/push-transactions"
import pullDocument from "./routes/writings/pull-document"
import listVersions from "./routes/writings/list-versions"
import getVersion from "./routes/writings/get-version"

type CreateAppInput = {
  allowedOrigins: string[]
  apiBaseUrl: string
  authDebugEnabled: boolean
  getSession: GetSession
  logger: ApiLogger
  services: AppServices
}

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

function handleRequestError(
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

export function createApp(input: CreateAppInput) {
  const app = createRouter()
  const openApiDocumentConfig = {
    info: {
      description:
        "글쓰기 플랫폼 API입니다. 글감 탐색, 글 작성, 자동 저장 등 에세이 작성 워크플로우를 지원합니다.",
      title: "Writing App API",
      version: "1.0.0",
    },
    openapi: "3.0.0" as const,
    security: [],
    servers: [
      {
        description: "API 서버",
        url: input.apiBaseUrl,
      },
    ],
  }
  const allowedOrigins = new Set(input.allowedOrigins)

  // --- Global middleware ---

  app.use(
    "*",
    cors({
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      origin: (origin) => {
        if (!origin) return null
        return allowedOrigins.has(origin) ? origin : null
      },
    })
  )

  app.use("*", createRequestLoggerMiddleware(input.logger))
  app.use("*", createResolveSessionMiddleware(input.getSession))

  // --- DI: inject services into context ---

  app.use("*", async (c, next) => {
    c.set("services", input.services)
    return next()
  })

  // --- Request timeout ---
  // AI 엔드포인트는 30s, 나머지는 60s. 단일 미들웨어로 이중 등록을 방지한다.

  app.use("*", (c, next) => {
    const ms = c.req.path.startsWith("/ai/")
      ? AI_TIMEOUT_MS
      : DEFAULT_TIMEOUT_MS
    return timeout(ms, throwTimeoutError)(c, next)
  })

  // --- Error handler ---

  app.onError((error, c) => {
    if (error instanceof Error && error.name === "TimeoutError") {
      return c.json(
        {
          error: {
            code: "request_timeout",
            message: error.message,
          },
        },
        408
      )
    }

    return handleRequestError(c, error, input.logger, "request failed")
  })

  // --- Routes ---

  app.route("/", getHealth)
  app.route("/", authHandler)
  app.route("/", getSession)
  app.route("/", getHome)
  app.route("/", getAISuggestions)
  app.route("/", getDocumentReview)
  app.route("/", getFlowReview)
  app.route("/", listPrompts)
  app.route("/", getPrompt)
  app.route("/", savePrompt)
  app.route("/", unsavePrompt)
  app.route("/", listWritings)
  app.route("/", createWriting)
  app.route("/", getWriting)
  app.route("/", autosaveWriting)
  app.route("/", deleteWriting)
  app.route("/", pushTransactions)
  app.route("/", pullDocument)
  app.route("/", listVersions)
  app.route("/", getVersion)

  if (input.authDebugEnabled) {
    app.route("/", getAuthEmails)
  }

  // --- OpenAPI spec ---

  app.get("/openapi.json", (c) => {
    return c.json(app.getOpenAPIDocument(openApiDocumentConfig))
  })

  // Register security scheme for cookie auth
  app.openAPIRegistry.registerComponent("securitySchemes", "cookieAuth", {
    description:
      "better-auth가 관리하는 세션 쿠키입니다. /api/auth/sign-in/email 로그인 후 자동으로 설정됩니다.",
    in: "cookie",
    name: "better-auth.session_token",
    type: "apiKey",
  })

  // --- Scalar API Reference ---

  app.get(
    "/docs",
    apiReference({
      pageTitle: "Writing App API",
      url: "/openapi.json",
      theme: "kepler",
    })
  )

  // Validate OpenAPI document at startup to catch config errors early
  if (process.env.NODE_ENV !== "production") {
    app.getOpenAPIDocument(openApiDocumentConfig)
  }

  // --- 404 handler ---

  app.notFound((c) =>
    c.json(
      {
        error: {
          code: "not_found",
          message: "요청한 경로를 찾을 수 없습니다.",
        },
      },
      404
    )
  )

  return app
}
