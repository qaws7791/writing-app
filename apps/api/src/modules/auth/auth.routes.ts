import { defineApiRoute } from "@/context/hono-env"
import { requireActiveSession } from "@/middleware/auth.middleware"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { parseLearnerRouteResponse } from "@/http/learner-response"
import { sessionResponseSchema } from "@/modules/auth/auth.schemas"

export const authSessionRoute = defineApiRoute({
  method: "get",
  middleware: [requireActiveSession],
  operationId: "getAuthSession",
  path: "/auth/session",
  responses: authenticatedResponses(
    jsonResponse("현재 인증 세션입니다.", sessionResponseSchema)
  ),
  security: [{ learnerSessionCookie: [] }],
  summary: "현재 세션 조회",
  handler: (context) => {
    return context.json(
      parseLearnerRouteResponse(
        context,
        "LearnerSessionResponse",
        sessionResponseSchema,
        {
          user: context.var.activeSession.user,
        }
      ),
      200
    )
  },
})
