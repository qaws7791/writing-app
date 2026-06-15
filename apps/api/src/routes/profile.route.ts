import { Hono } from "hono"
import { learnerAccountStatuses } from "@workspace/core/status"

import { readBearerToken, type SessionResolver } from "@/auth/session"
import { errorResponse } from "@/routes/error-response"

export type LearnerProfileStatsDto = {
  readonly completedLessons: number
  readonly currentStreakDays: number
  readonly lastActiveDate: string | null
  readonly progressPercent: number
  readonly totalLessons: number
}

export type ProfileReader = {
  readonly readProfileStats: (userId: string) => Promise<LearnerProfileStatsDto>
}

export type ProfileRouteDependencies = {
  readonly profileReader: ProfileReader
  readonly sessionResolver: SessionResolver
}

export function createProfileRoute({
  profileReader,
  sessionResolver,
}: ProfileRouteDependencies): Hono {
  const route = new Hono()

  route.get("/", async (context) => {
    const token = readBearerToken(context.req.header("Authorization") ?? null)

    if (token === null) {
      return context.json(errorResponse("unauthorized"), 401)
    }

    const session = await sessionResolver.resolveSession(token)

    if (session === null) {
      return context.json(errorResponse("unauthorized"), 401)
    }

    if (session.user.status !== learnerAccountStatuses.active) {
      return context.json(errorResponse("account_unavailable"), 403)
    }

    const stats = await profileReader.readProfileStats(session.user.id)

    return context.json({
      stats,
      user: session.user,
    })
  })

  return route
}
