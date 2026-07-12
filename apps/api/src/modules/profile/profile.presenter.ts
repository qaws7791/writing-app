import type { AuthenticatedSession } from "@workspace/core/auth"
import type { LearnerProfileStatsDto } from "@workspace/core/learning"

export function presentProfile({
  session,
  stats,
}: {
  readonly session: AuthenticatedSession
  readonly stats: LearnerProfileStatsDto
}) {
  return {
    stats,
    user: session.user,
  }
}
