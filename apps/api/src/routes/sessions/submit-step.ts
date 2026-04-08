import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  sessionIdParamSchema,
  sessionRuntimeSchema,
  submitStepBodySchema,
  toApplicationError,
  toSessionId,
} from "@workspace/core"

import type { AppEnv } from "../../app-env"
import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { SubmitStepUseCase } from "../../runtime/tokens"

const submitStepRoute = createRoute({
  method: "post",
  path: "/sessions/{sessionId}/steps/{stepOrder}/submit",
  request: {
    body: {
      content: { "application/json": { schema: submitStepBodySchema } },
      required: true,
    },
    params: z.object({
      sessionId: sessionIdParamSchema,
      stepOrder: z.coerce.number().int().min(1),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: sessionRuntimeSchema } },
      description: "스텝 제출 완료",
    },
    202: {
      content: { "application/json": { schema: sessionRuntimeSchema } },
      description: "AI 처리 수락",
    },
    default: defaultErrorResponse,
  },
  description: "스텝 응답을 제출하고 갱신된 세션 스냅샷을 반환합니다.",
  summary: "스텝 제출",
  tags: ["세션"],
  security: [{ cookieAuth: [] }],
})

const app = new OpenAPIHono<AppEnv>()

app.openapi(submitStepRoute, async (context) => {
  const userId = requireUserId(context)
  const params = context.req.valid("param")
  const body = context.req.valid("json")
  const submitStep = context.var.submitStepUseCase
  const result = await submitStep(userId, toSessionId(params.sessionId), {
    stepOrder: params.stepOrder,
    response: body.response,
  })

  if (result.isErr()) {
    throw toApplicationError(result.error)
  }

  return context.json(result.value.runtime, result.value.acceptedAi ? 202 : 200)
})

export default app
