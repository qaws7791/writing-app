import { createRoute, z } from "@hono/zod-openapi"
import {
  autosaveDraftBodySchema,
  autosaveDraftResponseSchema,
  draftIdParamSchema,
  toDraftId,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "초안의 제목 또는 본문을 자동 저장합니다.",
  method: "patch",
  path: "/drafts/{draftId}",
  request: {
    body: {
      content: {
        "application/json": {
          schema: autosaveDraftBodySchema,
        },
      },
      required: true,
    },
    params: z.object({
      draftId: draftIdParamSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: autosaveDraftResponseSchema,
        },
      },
      description: "자동 저장 완료",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "초안 자동 저장",
  tags: ["초안"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { draftId } = c.req.valid("param")
  const body = c.req.valid("json")
  const { draftUseCases } = c.var.services
  const result = await draftUseCases.autosaveDraft(
    userId,
    toDraftId(draftId),
    body
  )
  return c.json(result, 200)
})

export default app
