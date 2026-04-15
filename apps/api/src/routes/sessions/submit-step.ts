import { z } from "@hono/zod-openapi"
import {
  sessionIdParamSchema,
  sessionRuntimeSchema,
  submitStepBodySchema,
  toSessionId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { withStatus } from "../../lib/hono/define-route"
import { SubmitStepUseCase } from "../../runtime/tokens"

export default route({
  method: "post",
  path: "/sessions/{sessionId}/steps/{stepOrder}/submit",
  inject: { submitStep: SubmitStepUseCase },
  request: {
    body: submitStepBodySchema,
    params: z.object({
      sessionId: sessionIdParamSchema,
      stepOrder: z.coerce.number().int().min(1),
    }),
  },
  response: {
    200: sessionRuntimeSchema,
    202: sessionRuntimeSchema,
    default: defaultErrorResponse,
  },
  meta: {
    description: "스텝 응답을 제출하고 갱신된 세션 스냅샷을 반환합니다.",
    summary: "스텝 제출",
    tags: ["세션"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ submitStep, params, body, context }) => {
    const userId = requireUserId(context)
    const result = await submitStep(userId, toSessionId(params.sessionId), {
      stepOrder: params.stepOrder,
      response: body.response,
    })
    return result.map((value) =>
      withStatus(value.runtime, value.acceptedAi ? 202 : 200)
    )
  },
})
