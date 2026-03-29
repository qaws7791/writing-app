import { createRoute } from "@hono/zod-openapi"
import {
  promptFiltersQuerySchema,
  promptListResponseSchema,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"

const route = createRoute({
  description:
    "주제, 난이도, 검색어 등 필터를 적용하여 글감 목록을 조회합니다.",
  method: "get",
  path: "/prompts",
  request: {
    query: promptFiltersQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: promptListResponseSchema,
        },
      },
      description: "글감 목록",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "글감 목록 조회",
  tags: ["글감"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const filters = c.req.valid("query")
  const result = await c.var.listPromptsUseCase(userId, filters)
  const prompts = unwrapOrThrow(result)
  return c.json({ items: prompts }, 200)
})

export default app
