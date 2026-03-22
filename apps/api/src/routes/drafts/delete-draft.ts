import { createRoute, z } from "@hono/zod-openapi"
import { draftIdParamSchema, toDraftId } from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "특정 초안을 영구적으로 삭제합니다.",
  method: "delete",
  path: "/drafts/{draftId}",
  request: {
    params: z.object({
      draftId: draftIdParamSchema,
    }),
  },
  responses: {
    204: {
      description: "초안 삭제 완료",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "초안 삭제",
  tags: ["초안"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { draftId } = c.req.valid("param")
  const { draftUseCases } = c.var.services
  await draftUseCases.deleteDraft(userId, toDraftId(draftId))
  return c.body(null, 204)
})

export default app
