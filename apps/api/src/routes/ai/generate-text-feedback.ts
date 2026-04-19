import {
  generateTextFeedbackBodySchema,
  writingFeedbackSchema,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { createRateLimitMiddleware } from "../../middleware/rate-limit-middleware"
import type { RateLimitBackend } from "../../rate-limit/rate-limit-backend"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { GenerateFeedbackUseCase } from "../../runtime/tokens"

export function createGenerateTextFeedbackRoute(
  rateLimitBackend: RateLimitBackend
) {
  const aiRateLimiter = createRateLimitMiddleware(rateLimitBackend, {
    bucket: "ai-feedback",
    limit: 20,
    windowMs: 60 * 60 * 1000,
  })

  return route({
    method: "post",
    path: "/ai/feedback",
    inject: {
      generateFeedback: GenerateFeedbackUseCase,
    },
    middleware: [aiRateLimiter],
    timeoutMs: 30_000,
    request: {
      body: generateTextFeedbackBodySchema,
    },
    response: { 200: writingFeedbackSchema, default: defaultErrorResponse },
    meta: {
      description: "텍스트에 대한 AI 소크라테스식 피드백을 생성합니다.",
      summary: "AI 텍스트 피드백 생성",
      tags: ["AI"],
      security: [{ cookieAuth: [] }],
    },
    handler: async ({ generateFeedback, body, context }) => {
      const userId = requireUserId(context)
      const result = await generateFeedback({
        userId,
        bodyPlainText: body.text,
        level: body.level,
      })
      return unwrapOrThrow(result)
    },
  })
}
