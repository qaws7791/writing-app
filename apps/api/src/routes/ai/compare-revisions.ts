import { z } from "@hono/zod-openapi"
import {
  compareRevisionsBodySchema,
  revisionComparisonSchema,
  writingIdParamSchema,
  toWritingId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import {
  CompareRevisionsUseCase,
  GetWritingUseCase,
} from "../../runtime/tokens"

export default route({
  method: "post",
  path: "/writings/{writingId}/compare",
  inject: {
    getWriting: GetWritingUseCase,
    compareRevisions: CompareRevisionsUseCase,
  },
  request: {
    body: compareRevisionsBodySchema,
    params: z.object({ writingId: writingIdParamSchema }),
  },
  response: { 200: revisionComparisonSchema, default: defaultErrorResponse },
  meta: {
    description: "두 버전의 글을 비교하여 개선 사항을 분석합니다.",
    summary: "글 버전 비교",
    tags: ["AI"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ getWriting, compareRevisions, body, params, context }) => {
    const userId = requireUserId(context)
    // Authorize: check user owns the writing
    await getWriting(userId, toWritingId(params.writingId))
    const result = await compareRevisions({
      originalText: body.originalText,
      revisedText: body.revisedText,
    })
    return unwrapOrThrow(result)
  },
})
