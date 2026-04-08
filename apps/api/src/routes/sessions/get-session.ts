import { z } from "@hono/zod-openapi"
import {
  sessionRuntimeSchema,
  sessionIdParamSchema,
  toSessionId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { GetSessionDetailUseCase } from "../../runtime/tokens"

export default route({
  method: "get",
  path: "/sessions/{sessionId}",
  inject: { getSessionDetail: GetSessionDetailUseCase },
  request: { params: z.object({ sessionId: sessionIdParamSchema }) },
  response: {
    200: sessionRuntimeSchema,
    default: defaultErrorResponse,
  },
  meta: {
    description: "특정 세션의 런타임 스냅샷을 조회합니다.",
    summary: "세션 상세 조회",
    tags: ["세션"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ getSessionDetail, params, context }) => {
    const userId = requireUserId(context)
    const result = await getSessionDetail(userId, toSessionId(params.sessionId))
    return unwrapOrThrow(result)
  },
})
