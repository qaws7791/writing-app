import { createRoute, z } from "@hono/zod-openapi"
import {
  promptDetailSchema,
  promptIdParamSchema,
  toPromptId,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "특정 글감의 상세 정보를 조회합니다.",
  method: "get",
  path: "/prompts/{promptId}",
  request: {
    params: z.object({
      promptId: promptIdParamSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: promptDetailSchema,
        },
      },
      description: "글감 상세",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "글감 상세 조회",
  tags: ["글감"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { promptId } = c.req.valid("param")
  const { promptUseCases } = c.var.services
  const prompt = await promptUseCases.getPrompt(userId, toPromptId(promptId))
  return c.json(prompt, 200)
})

export default app
