import { createRoute } from "@hono/zod-openapi"
import { draftListResponseSchema } from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "현재 사용자의 초안 목록을 최근 수정 순으로 조회합니다.",
  method: "get",
  path: "/drafts",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: draftListResponseSchema,
        },
      },
      description: "초안 목록",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "초안 목록 조회",
  tags: ["초안"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { draftUseCases } = c.var.services
  const drafts = await draftUseCases.listDrafts(userId)
  return c.json({ items: drafts }, 200)
})

export default app
