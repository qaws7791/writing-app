import { toDraftId, toPromptId } from "@workspace/core"

import type { DraftApiService } from "../application-services.js"
import { createApiRouter, type ApiRouter } from "../app-variables.js"
import { currentUserId } from "../http/context.js"
import { parseJsonBody, parseValue } from "../http/request.js"
import {
  autosaveDraftSchema,
  createDraftSchema,
  draftIdSchema,
} from "../http/schemas.js"
import { requireAuth } from "../middleware/require-auth.js"

export function createDraftsRouter(draftUseCases: DraftApiService): ApiRouter {
  const router = createApiRouter()

  router.use("*", requireAuth)

  router.get("/", async (context) => {
    const userId = currentUserId(context)
    const drafts = await draftUseCases.listDrafts(userId)

    return context.json({
      items: drafts,
    })
  })

  router.post("/", async (context) => {
    const userId = currentUserId(context)
    const body = await parseJsonBody(context, createDraftSchema)
    const draft = await draftUseCases.createDraft(userId, {
      content: body.content,
      sourcePromptId:
        body.sourcePromptId === undefined
          ? undefined
          : toPromptId(body.sourcePromptId),
      title: body.title,
    })

    return context.json(draft, 201)
  })

  router.get("/:draftId", async (context) => {
    const userId = currentUserId(context)
    const draftId = toDraftId(
      parseValue(draftIdSchema, context.req.param("draftId"))
    )
    const draft = await draftUseCases.getDraft(userId, draftId)

    return context.json(draft)
  })

  router.patch("/:draftId", async (context) => {
    const userId = currentUserId(context)
    const draftId = toDraftId(
      parseValue(draftIdSchema, context.req.param("draftId"))
    )
    const body = await parseJsonBody(context, autosaveDraftSchema)
    const result = await draftUseCases.autosaveDraft(userId, draftId, body)

    return context.json(result)
  })

  router.delete("/:draftId", async (context) => {
    const userId = currentUserId(context)
    const draftId = toDraftId(
      parseValue(draftIdSchema, context.req.param("draftId"))
    )
    await draftUseCases.deleteDraft(userId, draftId)

    return context.body(null, 204)
  })

  return router
}
