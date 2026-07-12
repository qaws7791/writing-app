import type { LearnerProfileStatsDto } from "#core/modules/learning/domain/learner-read-model.dto"

export type ProfileReader = {
  readonly readProfileStats: (userId: string) => Promise<LearnerProfileStatsDto>
}
