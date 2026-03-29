import { createRoute } from "@hono/zod-openapi"
import {
  aiFlowReviewInputSchema,
  aiReviewResponseSchema,
} from "@workspace/core"

import { createRouter } from "../../http/create-router"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { createAiRateLimiter } from "../../middleware/ai-rate-limiter"
import { BODY_LIMITS, withBodyLimit } from "../../http/body-limit-middleware"

const route = createRoute({
  description: "문단 간 연결 흐름을 분석하고 개선점을 제안합니다.",
  method: "post",
  path: "/ai/review/flow",
  request: {
    body: {
      content: {
        "application/json": {
          schema: aiFlowReviewInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: aiReviewResponseSchema,
        },
      },
      description: "흐름 검토 결과",
    },
    default: defaultErrorResponse,
  },
  security: [{ cookieAuth: [] }],
  summary: "AI 흐름 검토",
  tags: ["AI 보조"],
})

const app = createRouter()

app.use(withBodyLimit(BODY_LIMITS.document))
// 분당 20회 제한 (사용자당)
app.use("*", createAiRateLimiter({ limit: 20, windowMs: 60 * 1000 }))

app.openapi(route, async (c) => {
  const userId = requireUserId(c)
  const { paragraphs } = c.req.valid("json")

  const items = await c.var.aiUseCases.getFlowReview(userId, paragraphs)
  return c.json({ items }, 200)
})

export default app
