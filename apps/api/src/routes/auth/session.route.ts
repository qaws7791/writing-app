import type { SessionResolver } from "@workspace/core/auth"

import { errorResponse } from "@/lib/error-response"
import { createRoute } from "@/lib/hono"
import { z } from "@hono/zod-openapi"

import {
  authenticatedResponses,
  jsonResponse,
  learnerUserSchema,
} from "@/lib/openapi-schemas"
import { resolveActiveSession } from "@/routes/route-helpers"

const sessionResponseSchema = z.object({
  user: learnerUserSchema,
})

export function createAuthSessionRoute(sessionResolver: SessionResolver) {
  return createRoute(
    {
      method: "get",
      operationId: "getAuthSession",
      path: "/session",
      responses: authenticatedResponses(
        jsonResponse("현재 인증 세션입니다.", sessionResponseSchema)
      ),
      security: [{ bearerAuth: [] }],
      summary: "현재 세션 조회",
    },
    async (context) => {
      const sessionResult = await resolveActiveSession(context, sessionResolver)

      if (sessionResult.kind === "err") {
        return context.json(
          errorResponse(sessionResult.code),
          sessionResult.status
        )
      }

      return context.json(
        {
          user: sessionResult.session.user,
        },
        200
      )
    }
  )
}
