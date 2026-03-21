import { cors } from "hono/cors"

import type {
  DraftApiService,
  HomeApiService,
  PromptApiService,
} from "./application-services.js"
import {
  createApiRouter,
  type ApiRouter,
  type GetSession,
} from "./app-variables.js"
import type { DevEmailInbox } from "./auth-email.js"
import { toErrorResponse } from "./http/errors.js"
import type { ApiLogger } from "./logger.js"
import { createRequestLoggerMiddleware } from "./middleware/request-logger.js"
import { createResolveSessionMiddleware } from "./middleware/resolve-session.js"
import { createAuthRouter } from "./routes/auth.js"
import { createDevAuthEmailsRouter } from "./routes/dev-auth-emails.js"
import { createDraftsRouter } from "./routes/drafts.js"
import { createHealthRouter } from "./routes/health.js"
import { createHomeRouter } from "./routes/home.js"
import { createPromptsRouter } from "./routes/prompts.js"
import { createSessionRouter } from "./routes/session.js"

type AppServices = {
  allowedOrigins: string[]
  authDebugEnabled: boolean
  authHandler: (request: Request) => Promise<Response>
  draftUseCases: DraftApiService
  getSession: GetSession
  homeUseCases: HomeApiService
  logger: ApiLogger
  promptUseCases: PromptApiService
  readLatestAuthEmail: DevEmailInbox["readLatestMessage"]
  sqliteVersion: string
}

export function createApp(services: AppServices): ApiRouter {
  const app = createApiRouter()
  const allowedOrigins = new Set([
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    ...services.allowedOrigins,
  ])

  app.use(
    "*",
    cors({
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      origin: (origin) => {
        if (!origin) {
          return "*"
        }

        return allowedOrigins.has(origin) ? origin : ""
      },
    })
  )

  app.use("*", createRequestLoggerMiddleware(services.logger))
  app.use("*", createResolveSessionMiddleware(services.getSession))

  app.onError((error, context) => {
    const response = toErrorResponse(error)
    const requestLogger =
      context.get("requestLogger") ??
      services.logger.child({
        method: context.req.method,
        path: context.req.path,
        requestId: context.get("requestId"),
        scope: "http",
      })

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
      requestLogger.error(logPayload, "request failed")
    } else {
      requestLogger.warn(logPayload, "request failed")
    }

    return context.json(
      response.body,
      response.status as 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500
    )
  })

  app.route("/health", createHealthRouter(services.sqliteVersion))
  app.route("/api/auth", createAuthRouter(services.authHandler))

  app.route("/session", createSessionRouter())

  if (services.authDebugEnabled) {
    app.route("/dev", createDevAuthEmailsRouter(services.readLatestAuthEmail))
  }

  app.route("/home", createHomeRouter(services.homeUseCases))
  app.route("/prompts", createPromptsRouter(services.promptUseCases))
  app.route("/drafts", createDraftsRouter(services.draftUseCases))

  app.notFound((context) =>
    context.json(
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
