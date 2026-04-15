import {
  compareRevisionsBodySchema,
  revisionComparisonSchema,
} from "@workspace/core"

import { createAiRateLimiter } from "../../middleware/ai-rate-limiter"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { CompareRevisionsUseCase } from "../../runtime/tokens"

// AI 엔드포인트: 1시간 당 20회 제한
// TODO: 멀티 프로세스/재배포 안정성을 위해 SQLite 또는 Redis 기반 영속 스토어로 교체
const aiRateLimiter = createAiRateLimiter({
  limit: 20,
  windowMs: 60 * 60 * 1000,
})

export default route({
  method: "post",
  path: "/ai/compare",
  inject: {
    compareRevisions: CompareRevisionsUseCase,
  },
  middleware: [aiRateLimiter],
  timeoutMs: 30_000,
  request: {
    body: compareRevisionsBodySchema,
  },
  response: { 200: revisionComparisonSchema, default: defaultErrorResponse },
  meta: {
    description: "두 텍스트를 비교하여 개선 사항을 분석합니다.",
    summary: "AI 텍스트 비교 분석",
    tags: ["AI"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ compareRevisions, body, context }) => {
    const userId = requireUserId(context)
    const result = await compareRevisions({
      userId,
      originalText: body.originalText,
      revisedText: body.revisedText,
    })
    return unwrapOrThrow(result)
  },
})
