import type { LearnerProfileStatsDto } from "@workspace/core/modules/learning/domain/learner-read-model.dto"

export type ProfileReader = {
  readonly readProfileStats: (userId: string) => Promise<LearnerProfileStatsDto>
}
