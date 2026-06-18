import { defineApiRoute } from "@/context/hono-env"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { requireActiveSession } from "@/middleware/auth.middleware"
import { presentProfile } from "@/modules/profile/profile.presenter"
import { profileResponseSchema } from "@/modules/profile/profile.schemas"

export const profileRoute = defineApiRoute({
  method: "get",
  middleware: [requireActiveSession],
  operationId: "getProfile",
  path: "/profile",
  responses: authenticatedResponses(
    jsonResponse("학습자 프로필과 통계입니다.", profileResponseSchema)
  ),
  security: [{ bearerAuth: [] }],
  summary: "학습자 프로필 조회",
  handler: async (context) => {
    const stats =
      await context.var.requestContext.profileReader.readProfileStats(
        context.var.activeSession.user.id
      )

    return context.json(
      presentProfile({
        session: context.var.activeSession,
        stats,
      }),
      200
    )
  },
})
