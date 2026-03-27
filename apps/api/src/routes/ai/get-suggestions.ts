import { createRoute, z } from "@hono/zod-openapi"
import {
  aiSuggestionInputSchema,
  aiSuggestionResponseSchema,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"

const route = createRoute({
  description: "선택한 텍스트에 대한 AI 표현 개선 제안을 생성합니다.",
  method: "post",
  path: "/ai/suggestions",
  request: {
    body: {
      content: {
        "application/json": {
          schema: aiSuggestionInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: aiSuggestionResponseSchema,
        },
      },
      description: "AI 제안 목록",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "AI 표현 제안",
  tags: ["AI 보조"],
})

const app = createRouter()

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { text, type } = c.req.valid("json")
  const { aiUseCases } = c.var.services

  const suggestions = await aiUseCases.getSuggestions(userId, text, type)
  return c.json({ suggestions }, 200)
})

export default app
