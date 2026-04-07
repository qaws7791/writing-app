import { z } from "@hono/zod-openapi"
import {
  sessionIdParamSchema,
  submitStepBodySchema,
  toSessionId,
} from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
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
  response: { 204: "스텝 제출 완료", default: defaultErrorResponse },
  meta: {
    description: "스텝 응답을 제출합니다.",
    summary: "스텝 제출",
    tags: ["세션"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ submitStep, body, params, context }) => {
    const userId = requireUserId(context)
    await submitStep(userId, toSessionId(params.sessionId), {
      stepOrder: params.stepOrder,
      response: body.response,
    })
  },
})
