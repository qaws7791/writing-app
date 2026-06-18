import { defineApiRoute } from "@/context/hono-env"
import { requireActiveSession } from "@/middleware/auth.middleware"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { sessionResponseSchema } from "@/modules/auth/auth.schemas"

export const authSessionRoute = defineApiRoute({
  method: "get",
  middleware: [requireActiveSession],
  operationId: "getAuthSession",
  path: "/auth/session",
  responses: authenticatedResponses(
    jsonResponse("현재 인증 세션입니다.", sessionResponseSchema)
  ),
  security: [{ bearerAuth: [] }],
  summary: "현재 세션 조회",
  handler: (context) => {
    return context.json(
      {
        user: context.var.activeSession.user,
      },
      200
    )
  },
})
