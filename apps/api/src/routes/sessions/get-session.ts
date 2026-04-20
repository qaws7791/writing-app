import { z } from "@hono/zod-openapi"
import { sessionRuntimeSchema } from "@workspace/core/modules/progress"
import { sessionIdParamSchema } from "@workspace/core/modules/journeys"
import { parseSessionId } from "@workspace/core"

import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { GetSessionDetailUseCase } from "../../runtime/modules/sessions"

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
    security: cookieSecurity,
  },
  handler: async ({ getSessionDetail, params, context }) => {
    const userId = requireUserId(context)
    return getSessionDetail(userId, parseSessionId(params.sessionId))
  },
})
