import { apiReference } from "@scalar/hono-api-reference"
import type { Context } from "hono"
import { cors } from "hono/cors"

import type { AppServices, GetSession } from "./app-env"
import { errorToResponse } from "./http/error-response"
import { createRouter } from "./http/create-router"
import type { ApiLogger } from "./observability/logger"
import { createRequestLoggerMiddleware } from "./middleware/request-logger"
import { createResolveSessionMiddleware } from "./middleware/resolve-session"
import authHandler from "./routes/auth/auth-handler"
import getAuthEmails from "./routes/dev/get-auth-emails"
import autosaveDraft from "./routes/drafts/autosave-draft"
import createDraft from "./routes/drafts/create-draft"
import deleteDraft from "./routes/drafts/delete-draft"
import getDraft from "./routes/drafts/get-draft"
import listDrafts from "./routes/drafts/list-drafts"
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
  authDebugEnabled: boolean
  getSession: GetSession
  logger: ApiLogger
  services: AppServices
}

type ApiErrorResult = ReturnType<typeof errorToResponse>
type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500

function resolveRequestLogger(context: Context, logger: ApiLogger): ApiLogger {
  const requestLogger = context.get("requestLogger")

  if (requestLogger) {
    return requestLogger as ApiLogger
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
  message: string
) {
  const logPayload =
    error instanceof Error
      ? {
          code: response.body.error.code,
          err: error,
          status: response.status,
        }
      : {
          code: response.body.error.code,
          error,
          status: response.status,
        }

  if (response.status >= 500) {
    requestLogger.error(logPayload, message)
    return
  }

  requestLogger.warn(logPayload, message)
}

export function createApp(input: CreateAppInput) {
  const app = createRouter()
  const openApiDocumentConfig = {
    info: {
      description:
        "글쓰기 플랫폼 API입니다. 글감 탐색, 초안 작성, 자동 저장 등 에세이 작성 워크플로우를 지원합니다.",
      title: "Writing App API",
      version: "1.0.0",
    },
    openapi: "3.0.0" as const,
    security: [],
    servers: [
      {
        description: "로컬 개발 서버",
        url: "http://localhost:3010",
      },
    ],
  }
  const allowedOrigins = new Set([
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    ...input.allowedOrigins,
  ])

  // --- Global middleware ---

  app.use(
    "*",
    cors({
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      origin: (origin) => {
        if (!origin) return "*"
        return allowedOrigins.has(origin) ? origin : ""
      },
    })
  )

  app.use("*", createRequestLoggerMiddleware(input.logger))
  app.use("*", createResolveSessionMiddleware(input.getSession))

  // --- DI: inject services into context ---

  app.use("*", async (c, next) => {
    c.set("services", input.services)
    await next()
  })

  // --- Error handler ---

  app.onError((error, c) => {
    const response = errorToResponse(error)
    const requestLogger = resolveRequestLogger(c, input.logger)

    logRequestFailure(requestLogger, error, response, "request failed")

    return c.json(response.body, response.status as ApiErrorStatus)
  })

  // --- Routes ---

  app.route("/", getHealth)
  app.route("/", authHandler)
  app.route("/", getSession)
  app.route("/", getHome)
  app.route("/", listPrompts)
  app.route("/", getPrompt)
  app.route("/", savePrompt)
  app.route("/", unsavePrompt)
  app.route("/", listDrafts)
  app.route("/", createDraft)
  app.route("/", getDraft)
  app.route("/", autosaveDraft)
  app.route("/", deleteDraft)
  app.route("/", pushTransactions)
  app.route("/", pullDocument)
  app.route("/", listVersions)
  app.route("/", getVersion)

  if (input.authDebugEnabled) {
    app.route("/", getAuthEmails)
  }

  // --- OpenAPI spec ---

  app.get("/openapi.json", (c) => {
    try {
      return c.json(app.getOpenAPIDocument(openApiDocumentConfig))
    } catch (error) {
      const response = errorToResponse(error)
      const requestLogger = resolveRequestLogger(c, input.logger)

      logRequestFailure(
        requestLogger,
        error,
        response,
        "openapi document generation failed"
      )

      return c.json(response.body, response.status as ApiErrorStatus)
    }
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
