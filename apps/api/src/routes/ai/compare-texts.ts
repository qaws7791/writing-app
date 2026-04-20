import {
  compareRevisionsBodySchema,
  revisionComparisonSchema,
} from "@workspace/core"

import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { createRateLimitMiddleware } from "../../middleware/rate-limit-middleware"
import type { RateLimitBackend } from "../../rate-limit/rate-limit-backend"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { CompareRevisionsUseCase } from "../../runtime/tokens"

export function createCompareTextsRoute(rateLimitBackend: RateLimitBackend) {
  const aiRateLimiter = createRateLimitMiddleware(rateLimitBackend, {
    bucket: "ai-compare",
    limit: 20,
    windowMs: 60 * 60 * 1000,
  })

  return route({
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
      security: cookieSecurity,
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
}
