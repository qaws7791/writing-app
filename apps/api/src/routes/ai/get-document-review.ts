import {
  aiDocumentReviewInputSchema,
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
  path: "/ai/review/document",
  inject: { aiUseCases: AiUseCases },
  middleware: [
    withBodyLimit(BODY_LIMITS.document),
    createAiRateLimiter({ limit: 20, windowMs: 60 * 1000 }),
  ],
  request: { body: aiDocumentReviewInputSchema },
  response: { 200: aiReviewResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "문서 전체의 맞춤법 및 중복 표현을 검토합니다.",
    summary: "AI 문서 검토",
    tags: ["AI 보조"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ aiUseCases, body, context }) => {
    const userId = requireUserId(context)
    const items = await aiUseCases.getDocumentReview(userId, body.paragraphs)
    return { items }
  },
})
