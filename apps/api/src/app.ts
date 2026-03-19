import { Hono, type Context } from "hono"
import { cors } from "hono/cors"

import {
  createDraftUseCases,
  createHomeUseCases,
  createPromptUseCases,
} from "@workspace/application"
import { toDraftId, toPromptId, toUserId } from "@workspace/domain"

import { toErrorResponse } from "./http/errors.js"
import { parseJsonBody, parseValue } from "./http/request.js"
import {
  autosaveDraftSchema,
  createDraftSchema,
  draftIdSchema,
  promptFiltersSchema,
  promptIdSchema,
} from "./http/schemas.js"

type ApiApp = Hono<{
  Variables: {
    userId: ReturnType<typeof toUserId>
  }
}>

type AppServices = {
  draftUseCases: ReturnType<typeof createDraftUseCases>
  homeUseCases: ReturnType<typeof createHomeUseCases>
  promptUseCases: ReturnType<typeof createPromptUseCases>
  sqliteVersion: string
  userId: string
}

function currentUserId(
  context: Context<{
    Variables: {
      userId: ReturnType<typeof toUserId>
    }
  }>
): ReturnType<typeof toUserId> {
  return context.get("userId")
}

export function createApp(services: AppServices): ApiApp {
  const app: ApiApp = new Hono()
  const allowedOrigins = new Set([
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ])

  app.use("*", async (context, next) => {
    context.set("userId", toUserId(services.userId))
    await next()
  })

  app.use(
    "*",
    cors({
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      credentials: false,
      origin: (origin) => {
        if (!origin) {
          return "*"
        }

        return allowedOrigins.has(origin) ? origin : ""
      },
    })
  )

  app.onError((error, context) => {
    const response = toErrorResponse(error)
    return context.json(response.body, response.status as 400 | 403 | 404 | 500)
  })

  app.get("/health", (context) => {
    return context.json({
      jsonbSupported: true,
      sqliteVersion: services.sqliteVersion,
      status: "ok",
    })
  })

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
      sourcePromptId:
        body.sourcePromptId === undefined
          ? undefined
          : toPromptId(body.sourcePromptId),
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
