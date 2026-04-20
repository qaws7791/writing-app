import { z } from "@hono/zod-openapi"
import { sessionIdParamSchema } from "@workspace/core/modules/journeys"
import { parseJourneyId, parseSessionId } from "@workspace/core"

import {
  cookieSecurity,
  defaultErrorResponse,
} from "../../http/openapi-helpers"
import { requireUserId } from "../../http/require-user-id"
import { route } from "../../http/route"
import { CompleteSessionUseCase } from "../../runtime/modules/sessions"

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
    security: cookieSecurity,
  },
  handler: async ({ completeSession, body, params, context }) => {
    const userId = requireUserId(context)
    await completeSession(userId, {
      sessionId: parseSessionId(params.sessionId),
      journeyId: parseJourneyId(body.journeyId),
      nextSessionOrder: body.nextSessionOrder,
      totalSessions: body.totalSessions,
    })
  },
})
