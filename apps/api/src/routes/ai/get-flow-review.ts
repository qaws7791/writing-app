import {
  aiFlowReviewInputSchema,
  aiReviewResponseSchema,
} from "@workspace/core"

import { BODY_LIMITS, withBodyLimit } from "../../http/body-limit-middleware"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { createAiRateLimiter } from "../../middleware/ai-rate-limiter"
import { AiUseCases } from "../../runtime/tokens"

export default route({
  method: "post",
  path: "/ai/review/flow",
  inject: { aiUseCases: AiUseCases },
  middleware: [
    withBodyLimit(BODY_LIMITS.document),
    createAiRateLimiter({ limit: 20, windowMs: 60 * 1000 }),
  ],
  request: { body: aiFlowReviewInputSchema },
  response: { 200: aiReviewResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "문단 간 연결 흐름을 분석하고 개선점을 제안합니다.",
    summary: "AI 흐름 검토",
    tags: ["AI 보조"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ aiUseCases, body, context }) => {
    const userId = requireUserId(context)
    const items = await aiUseCases.getFlowReview(userId, body.paragraphs)
    return { items }
  },
})
