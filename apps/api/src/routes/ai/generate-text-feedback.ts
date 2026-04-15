import {
  generateTextFeedbackBodySchema,
  writingFeedbackSchema,
} from "@workspace/core"

import { createAiRateLimiter } from "../../middleware/ai-rate-limiter"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { GenerateFeedbackUseCase } from "../../runtime/tokens"

// AI 엔드포인트: 1시간 당 20회 제한
// TODO: 멀티 프로세스/재배포 안정성을 위해 SQLite 또는 Redis 기반 영속 스토어로 교체
const aiRateLimiter = createAiRateLimiter({
  limit: 20,
  windowMs: 60 * 60 * 1000,
})

export default route({
  method: "post",
  path: "/ai/feedback",
  inject: {
    generateFeedback: GenerateFeedbackUseCase,
  },
  middleware: [aiRateLimiter],
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
