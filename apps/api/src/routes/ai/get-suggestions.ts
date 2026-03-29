import { createRoute } from "@hono/zod-openapi"
import {
  aiSuggestionInputSchema,
  aiSuggestionResponseSchema,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { createAiRateLimiter } from "../../middleware/ai-rate-limiter"

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

// 분당 20회 제한 (사용자당)
app.use("*", createAiRateLimiter({ limit: 20, windowMs: 60 * 1000 }))

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { text, type } = c.req.valid("json")

  const suggestions = await c.var.aiUseCases.getSuggestions(userId, text, type)
  return c.json({ suggestions }, 200)
})

export default app
