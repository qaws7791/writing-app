import type { PromptId } from "../../shared/brand/index"

export type DailyRecommendation = {
  readonly date: string
  readonly displayOrder: number
  readonly promptId: PromptId
}

export type RecommendationHistoryEntry = {
  readonly date: string
  readonly promptId: number
}
