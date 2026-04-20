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
import { RetrySessionStepAiUseCase } from "../../runtime/modules/sessions"

export default route({
  method: "post",
  path: "/sessions/{sessionId}/steps/{stepOrder}/retry",
  inject: { retrySessionStepAi: RetrySessionStepAiUseCase },
  request: {
    params: z.object({
      sessionId: sessionIdParamSchema,
      stepOrder: z.coerce.number().int().min(1),
    }),
  },
  response: { 202: sessionRuntimeSchema, default: defaultErrorResponse },
  meta: {
    description: "실패한 세션 AI 작업을 다시 시작합니다.",
    summary: "세션 AI 재시도",
    tags: ["세션"],
    security: cookieSecurity,
  },
  handler: async ({ retrySessionStepAi, params, context }) => {
    const userId = requireUserId(context)
    return retrySessionStepAi(userId, parseSessionId(params.sessionId), {
      stepOrder: params.stepOrder,
    })
  },
})
