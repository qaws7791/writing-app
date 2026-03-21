import { Hono, type Context } from "hono"
import { cors } from "hono/cors"

import {
  toDraftId,
  toPromptId,
  toUserId,
  createDraftUseCasesAdapter,
  createHomeUseCasesAdapter,
  createPromptUseCasesAdapter,
} from "@workspace/backend-core"

import { toErrorResponse } from "./http/errors.js"
import { parseJsonBody, parseValue } from "./http/request.js"
import {
  autosaveDraftSchema,
  createDraftSchema,
  draftIdSchema,
  promptFiltersSchema,
  promptIdSchema,
} from "./http/schemas.js"
import { UnauthorizedError } from "./http/unauthorized-error.js"
import type { ApiLogger } from "./logger.js"

type ApiVariables = {
  authSession: AuthenticatedSession | null
  authUser: AuthenticatedUser | null
  requestId: string
  requestLogger: ApiLogger
  userId: ReturnType<typeof toUserId> | null
}

type ApiApp = Hono<{
  Variables: ApiVariables
}>

type AuthenticatedSession = {
  createdAt: Date | string
  expiresAt: Date | string
  id: string
  ipAddress?: string | null
  token: string
  updatedAt: Date | string
  userAgent?: string | null
  userId: string
}

type AuthenticatedUser = {
  email: string
  emailVerified: boolean
  id: string
  image?: string | null
  name: string
}

type AuthSession = {
  session: AuthenticatedSession
  user: AuthenticatedUser
}

type AppServices = {
  allowedOrigins: string[]
  authDebugEnabled: boolean
  authHandler: (request: Request) => Promise<Response>
  draftUseCases: ReturnType<typeof createDraftUseCasesAdapter>
  getSession: (request: Request) => Promise<AuthSession | null>
  homeUseCases: ReturnType<typeof createHomeUseCasesAdapter>
  logger: ApiLogger
  promptUseCases: ReturnType<typeof createPromptUseCasesAdapter>
  readLatestAuthEmail: (input: {
    email: string
    kind: "password-reset" | "verification"
  }) => {
    email: string
    kind: "password-reset" | "verification"
    sentAt: string
    token: string
    url: string
  } | null
  sqliteVersion: string
}

function currentUserId(
  context: Context<{
    Variables: ApiVariables
  }>
): ReturnType<typeof toUserId> {
  const userId = context.get("userId")

  if (!userId) {
    throw new UnauthorizedError("로그인이 필요합니다.")
  }

  return userId
}

function createRequestId(): string {
  return crypto.randomUUID()
}

export function createApp(services: AppServices): ApiApp {
  const app: ApiApp = new Hono()
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

  app.use("*", async (context, next) => {
    const startedAt = Date.now()
    const requestId =
      context.req.header("x-request-id")?.trim() || createRequestId()
    const requestLogger = services.logger.child({
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
  })

  app.use("*", async (context, next) => {
    const authSession = await services.getSession(context.req.raw)

    if (!authSession) {
      context.set("authSession", null)
      context.set("authUser", null)
      context.set("userId", null)
      await next()
      return
    }

    context.set("authSession", authSession.session)
    context.set("authUser", authSession.user)
    context.set("userId", toUserId(authSession.user.id))
    await next()
  })

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
      response.status as 400 | 401 | 403 | 404 | 500
    )
  })

  app.get("/health", (context) => {
    return context.json({
      sqliteVersion: services.sqliteVersion,
      status: "ok",
    })
  })

  app.on(["GET", "POST"], "/api/auth/*", (context) =>
    services.authHandler(context.req.raw)
  )

  app.get("/session", (context) => {
    const user = context.get("authUser")
    const session = context.get("authSession")

    if (!user || !session) {
      throw new UnauthorizedError("로그인이 필요합니다.")
    }

    return context.json({
      session,
      user,
    })
  })

  if (services.authDebugEnabled) {
    app.get("/dev/auth-emails", (context) => {
      const email = String(context.req.query("email") ?? "").trim()
      const kind = context.req.query("kind")

      if (!email || (kind !== "password-reset" && kind !== "verification")) {
        return context.json(
          {
            error: {
              code: "validation_error",
              message: "email과 kind가 필요합니다.",
            },
          },
          400
        )
      }

      const message = services.readLatestAuthEmail({
        email,
        kind,
      })

      if (!message) {
        return context.json(
          {
            error: {
              code: "not_found",
              message: "전송된 인증 메일을 찾을 수 없습니다.",
            },
          },
          404
        )
      }

      return context.json(message)
    })
  }

  for (const protectedPath of [
    "/home",
    "/prompts",
    "/prompts/*",
    "/drafts",
    "/drafts/*",
  ] as const) {
    app.use(protectedPath, async (context, next) => {
      if (!context.get("userId")) {
        throw new UnauthorizedError("로그인이 필요합니다.")
      }

      await next()
    })
  }

  app.get("/home", async (context) => {
    const userId = currentUserId(context)
    const home = await services.homeUseCases.getHome(userId)

    return context.json(home)
  })

  app.get("/prompts", async (context) => {
    const userId = currentUserId(context)
    const filters = parseValue(promptFiltersSchema, context.req.query())
    const prompts = await services.promptUseCases.listPrompts(userId, filters)

    return context.json({
      items: prompts,
    })
  })

  app.get("/prompts/:promptId", async (context) => {
    const userId = currentUserId(context)
    const promptId = toPromptId(
      parseValue(promptIdSchema, context.req.param("promptId"))
    )
    const prompt = await services.promptUseCases.getPrompt(userId, promptId)

    return context.json(prompt)
  })

  app.put("/prompts/:promptId/save", async (context) => {
    const userId = currentUserId(context)
    const promptId = toPromptId(
      parseValue(promptIdSchema, context.req.param("promptId"))
    )
    const result = await services.promptUseCases.savePrompt(userId, promptId)

    return context.json(result)
  })

  app.delete("/prompts/:promptId/save", async (context) => {
    const userId = currentUserId(context)
    const promptId = toPromptId(
      parseValue(promptIdSchema, context.req.param("promptId"))
    )
    await services.promptUseCases.unsavePrompt(userId, promptId)

    return context.body(null, 204)
  })

  app.get("/drafts", async (context) => {
    const userId = currentUserId(context)
    const drafts = await services.draftUseCases.listDrafts(userId)

    return context.json({
      items: drafts,
    })
  })

  app.post("/drafts", async (context) => {
    const userId = currentUserId(context)
    const body = await parseJsonBody(context, createDraftSchema)
    const draft = await services.draftUseCases.createDraft(userId, {
      content: body.content,
      sourcePromptId:
        body.sourcePromptId === undefined
          ? undefined
          : toPromptId(body.sourcePromptId),
      title: body.title,
    })

    return context.json(draft, 201)
  })

  app.get("/drafts/:draftId", async (context) => {
    const userId = currentUserId(context)
    const draftId = toDraftId(
      parseValue(draftIdSchema, context.req.param("draftId"))
    )
    const draft = await services.draftUseCases.getDraft(userId, draftId)

    return context.json(draft)
  })

  app.patch("/drafts/:draftId", async (context) => {
    const userId = currentUserId(context)
    const draftId = toDraftId(
      parseValue(draftIdSchema, context.req.param("draftId"))
    )
    const body = await parseJsonBody(context, autosaveDraftSchema)
    const result = await services.draftUseCases.autosaveDraft(
      userId,
      draftId,
      body
    )

    return context.json(result)
  })

  app.delete("/drafts/:draftId", async (context) => {
    const userId = currentUserId(context)
    const draftId = toDraftId(
      parseValue(draftIdSchema, context.req.param("draftId"))
    )
    await services.draftUseCases.deleteDraft(userId, draftId)

    return context.body(null, 204)
  })

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
