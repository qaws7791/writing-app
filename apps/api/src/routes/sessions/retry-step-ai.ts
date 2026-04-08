import { z } from "@hono/zod-openapi"
import {
  sessionIdParamSchema,
  sessionRuntimeSchema,
  toSessionId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { unwrapOrThrow } from "../../http/unwrap-or-throw"
import { RetrySessionStepAiUseCase } from "../../runtime/tokens"

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
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ retrySessionStepAi, params, context }) => {
    const userId = requireUserId(context)
    const result = await retrySessionStepAi(
      userId,
      toSessionId(params.sessionId),
      {
        stepOrder: params.stepOrder,
      }
    )
    return unwrapOrThrow(result)
  },
})
