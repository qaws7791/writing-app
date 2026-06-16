import { Hono } from "hono"

import type { SessionResolver } from "@/auth/session"
import { errorResponse } from "@/routes/error-response"
import { resolveActiveSession } from "@/routes/route-helpers"

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

    return context.json({
      stats,
      user: sessionResult.session.user,
    })
  })

  return route
}
