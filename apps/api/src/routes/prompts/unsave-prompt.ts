import { createRoute, z } from "@hono/zod-openapi"
import { promptIdParamSchema, toPromptId } from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"

const route = createRoute({
  description: "특정 글감을 저장 목록에서 제거합니다.",
  method: "delete",
  path: "/prompts/{promptId}/save",
  request: {
    params: z.object({
      promptId: promptIdParamSchema,
    }),
  },
  responses: {
    204: {
      description: "글감 저장 해제 완료",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "글감 저장 해제",
  tags: ["글감"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { promptId } = c.req.valid("param")
  const result = await c.var.unsavePromptUseCase(userId, toPromptId(promptId))
  unwrapOrThrow(result)
  return c.body(null, 204)
})

export default app
