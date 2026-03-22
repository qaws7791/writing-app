import { createRoute, z } from "@hono/zod-openapi"
import {
  draftDetailSchema,
  draftIdParamSchema,
  toDraftId,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "특정 초안의 전체 내용을 조회합니다.",
  method: "get",
  path: "/drafts/{draftId}",
  request: {
    params: z.object({
      draftId: draftIdParamSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: draftDetailSchema,
        },
      },
      description: "초안 상세",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "초안 상세 조회",
  tags: ["초안"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { draftId } = c.req.valid("param")
  const { draftUseCases } = c.var.services
  const draft = await draftUseCases.getDraft(userId, toDraftId(draftId))
  return c.json(draft, 200)
})

export default app
