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
import { StartSessionUseCase } from "../../runtime/modules/sessions"

export default route({
  method: "post",
  path: "/sessions/{sessionId}/start",
  inject: { startSession: StartSessionUseCase },
  request: { params: z.object({ sessionId: sessionIdParamSchema }) },
  response: { 200: sessionRuntimeSchema, default: defaultErrorResponse },
  meta: {
    description: "세션을 시작합니다.",
    summary: "세션 시작",
    tags: ["세션"],
    security: cookieSecurity,
  },
  handler: async ({ startSession, params, context }) => {
    const userId = requireUserId(context)
    return startSession(userId, parseSessionId(params.sessionId))
  },
})
