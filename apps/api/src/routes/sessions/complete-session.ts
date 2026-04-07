import { z } from "@hono/zod-openapi"
import { sessionIdParamSchema, toSessionId, toJourneyId } from "@workspace/core"

import { defaultErrorResponse } from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { CompleteSessionUseCase } from "../../runtime/tokens"

const completeSessionBodySchema = z.object({
  journeyId: z.number().int().positive(),
  nextSessionOrder: z.number().int().min(1),
  totalSessions: z.number().int().min(1),
})

export default route({
  method: "post",
  path: "/sessions/{sessionId}/complete",
  inject: { completeSession: CompleteSessionUseCase },
  request: {
    body: completeSessionBodySchema,
    params: z.object({ sessionId: sessionIdParamSchema }),
  },
  response: { 204: "세션 완료", default: defaultErrorResponse },
  meta: {
    description: "세션을 완료 처리합니다.",
    summary: "세션 완료",
    tags: ["세션"],
    security: [{ cookieAuth: [] }],
  },
  handler: async ({ completeSession, body, params, context }) => {
    const userId = requireUserId(context)
    await completeSession(userId, {
      sessionId: toSessionId(params.sessionId),
      journeyId: toJourneyId(body.journeyId),
      nextSessionOrder: body.nextSessionOrder,
      totalSessions: body.totalSessions,
    })
  },
})
