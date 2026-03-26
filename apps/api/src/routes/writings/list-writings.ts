import { createRoute } from "@hono/zod-openapi"
import {
  cursorPageQuerySchema,
  writingListResponseSchema,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "현재 사용자의 글 목록을 최근 수정 순으로 조회합니다.",
  method: "get",
  path: "/writings",
  request: {
    query: cursorPageQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: writingListResponseSchema,
        },
      },
      description: "글 목록",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "글 목록 조회",
  tags: ["글"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const query = c.req.valid("query")
  const { writingUseCases } = c.var.services
  const page = await writingUseCases.listWritings(userId, query)
  return c.json(page, 200)
})

export default app
