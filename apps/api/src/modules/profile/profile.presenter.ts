import type { AuthenticatedSession } from "@workspace/core/modules/auth"
import type { LearnerProfileStatsDto } from "@workspace/core/modules/learning"

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
