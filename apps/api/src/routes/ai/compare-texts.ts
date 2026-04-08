import {
  compareRevisionsBodySchema,
  revisionComparisonSchema,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { CompareRevisionsUseCase } from "../../runtime/tokens"

export default route({
  method: "post",
  path: "/ai/compare",
  inject: {
    compareRevisions: CompareRevisionsUseCase,
  },
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
    requireUserId(context)
    const result = await compareRevisions({
      originalText: body.originalText,
      revisedText: body.revisedText,
    })
    return unwrapOrThrow(result)
  },
})
