import { z } from "@hono/zod-openapi"
import {
  syncPullQuerySchema,
  syncPullResponseSchema,
  writingIdParamSchema,
} from "@workspace/core/modules/writings"
import { toWritingId } from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { PullDocumentUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/writings/{writingId}/sync/pull",
  inject: { pullDocument: PullDocumentUseCase },
  request: {
    params: z.object({ writingId: writingIdParamSchema }),
    query: syncPullQuerySchema,
  },
  response: { 200: syncPullResponseSchema, default: defaultErrorResponse },
  meta: {
    description: "서버에서 최신 문서 상태를 가져옵니다.",
    summary: "문서 상태 풀",
    tags: ["동기화"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ pullDocument, params, query, context }) => {
    const userId = requireUserId(context)
    const result = await pullDocument(
      userId,
      toWritingId(params.writingId),
      query.since
    )
    return unwrapOrThrow(result)
  },
})
