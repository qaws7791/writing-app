import { createRoute, z } from "@hono/zod-openapi"
import {
  promptIdParamSchema,
  promptSaveResponseSchema,
  toPromptId,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description:
    "특정 글감을 저장 목록에 추가합니다. 이미 저장된 경우 멱등적으로 동작합니다.",
  method: "put",
  path: "/prompts/{promptId}/save",
  request: {
    params: z.object({
      promptId: promptIdParamSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: promptSaveResponseSchema,
        },
      },
      description: "글감 저장 완료",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "글감 저장",
  tags: ["글감"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { promptId } = c.req.valid("param")
  const { promptUseCases } = c.var.services
  const result = await promptUseCases.savePrompt(userId, toPromptId(promptId))
  return c.json(result, 200)
})

export default app
