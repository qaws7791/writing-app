import { z } from "@hono/zod-openapi"
import {
  sessionIdParamSchema,
  userSessionProgressSchema,
  toSessionId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { StartSessionUseCase } from "../../runtime/tokens"

export default route({
  method: "post",
  path: "/sessions/{sessionId}/start",
  inject: { startSession: StartSessionUseCase },
  request: { params: z.object({ sessionId: sessionIdParamSchema }) },
  response: { 200: userSessionProgressSchema, default: defaultErrorResponse },
  meta: {
    description: "세션을 시작합니다.",
    summary: "세션 시작",
    tags: ["세션"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ startSession, params, context }) => {
    const userId = requireUserId(context)
    const result = await startSession(userId, toSessionId(params.sessionId))
    return unwrapOrThrow(result)
  },
})
