import { z } from "@hono/zod-openapi"
import {
  versionListResponseSchema,
  writingIdParamSchema,
} from "@workspace/core/modules/writings"
import { cursorPageQuerySchema, toWritingId } from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { ListVersionsUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/writings/{writingId}/versions",
  inject: { listVersions: ListVersionsUseCase },
  request: {
    params: z.object({ writingId: writingIdParamSchema }),
    query: cursorPageQuerySchema,
  },
  response: {
    200: versionListResponseSchema,
    default: defaultErrorResponse,
  },
  meta: {
    description: "문서의 버전 기록 목록을 조회합니다.",
    summary: "버전 기록 목록",
    tags: ["동기화"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ listVersions, params, query, context }) => {
    const userId = requireUserId(context)
    const result = await listVersions(
      userId,
      toWritingId(params.writingId),
      query
    )
    return unwrapOrThrow(result)
  },
})
