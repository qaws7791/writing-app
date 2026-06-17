import { z } from "@hono/zod-openapi"

import type { SessionResolver } from "@workspace/core/auth"
import type { ProfileReader } from "@workspace/core/learning"
import { errorResponse } from "@/lib/error-response"
import { createRoute } from "@/lib/hono"
import {
  authenticatedResponses,
  jsonResponse,
  learnerUserSchema,
} from "@/lib/openapi-schemas"
import { resolveActiveSession } from "@/routes/route-helpers"

export type ProfileRouteDependencies = {
  readonly profileReader: ProfileReader
  readonly sessionResolver: SessionResolver
}

const profileResponseSchema = z.object({
  stats: z.object({
    completedLessons: z.number().int().nonnegative(),
    currentStreakDays: z.number().int().nonnegative(),
    lastActiveDate: z.string().nullable(),
    progressPercent: z.number().int().min(0).max(100),
    totalLessons: z.number().int().nonnegative(),
  }),
  user: learnerUserSchema,
})

export function createProfileRoute({
  profileReader,
  sessionResolver,
}: ProfileRouteDependencies) {
  return createRoute(
    {
      method: "get",
      operationId: "getProfile",
      path: "/",
      responses: authenticatedResponses(
        jsonResponse("학습자 프로필과 통계입니다.", profileResponseSchema)
      ),
      security: [{ bearerAuth: [] }],
      summary: "학습자 프로필 조회",
    },
    async (context) => {
      const sessionResult = await resolveActiveSession(context, sessionResolver)

      if (sessionResult.kind === "err") {
        return context.json(
          errorResponse(sessionResult.code),
          sessionResult.status
        )
      }

      const stats = await profileReader.readProfileStats(
        sessionResult.session.user.id
      )

      return context.json(
        {
          stats,
          user: sessionResult.session.user,
        },
        200
      )
    }
  )
}
