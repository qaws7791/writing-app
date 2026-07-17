import type { LearnerProfileStatsDto } from "@workspace/contracts/learning/read-data"

export type ProfileReader = {
  readonly readProfileStats: (userId: string) => Promise<LearnerProfileStatsDto>
}
