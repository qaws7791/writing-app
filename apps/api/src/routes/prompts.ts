import { toPromptId } from "@workspace/core"

import type { PromptApiService } from "../application-services.js"
import { createApiRouter, type ApiRouter } from "../app-variables.js"
import { currentUserId } from "../http/context.js"
import { parseValue } from "../http/request.js"
import { promptFiltersSchema, promptIdSchema } from "../http/schemas.js"
import { requireAuth } from "../middleware/require-auth.js"

export function createPromptsRouter(
  promptUseCases: PromptApiService
): ApiRouter {
  const router = createApiRouter()

  router.use("*", requireAuth)

  router.get("/", async (context) => {
    const userId = currentUserId(context)
    const filters = parseValue(promptFiltersSchema, context.req.query())
    const prompts = await promptUseCases.listPrompts(userId, filters)

    return context.json({
      items: prompts,
    })
  })

  router.get("/:promptId", async (context) => {
    const userId = currentUserId(context)
    const promptId = toPromptId(
      parseValue(promptIdSchema, context.req.param("promptId"))
    )
    const prompt = await promptUseCases.getPrompt(userId, promptId)

    return context.json(prompt)
  })

  router.put("/:promptId/save", async (context) => {
    const userId = currentUserId(context)
    const promptId = toPromptId(
      parseValue(promptIdSchema, context.req.param("promptId"))
    )
    const result = await promptUseCases.savePrompt(userId, promptId)

    return context.json(result)
  })

  router.delete("/:promptId/save", async (context) => {
    const userId = currentUserId(context)
    const promptId = toPromptId(
      parseValue(promptIdSchema, context.req.param("promptId"))
    )
    await promptUseCases.unsavePrompt(userId, promptId)

    return context.body(null, 204)
  })

  return router
}
