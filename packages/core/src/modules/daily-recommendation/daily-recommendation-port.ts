import type { RecommendationHistoryEntry } from "./daily-recommendation-types"

export interface DailyRecommendationRepository {
  existsForDate(date: string): Promise<boolean>
  create(
    date: string,
    entries: readonly { promptId: number; displayOrder: number }[]
  ): Promise<void>
  getRecentHistory(
    limit: number
  ): Promise<readonly RecommendationHistoryEntry[]>
  getAllPromptIds(): Promise<readonly number[]>
  refreshTodayFlags(
    entries: readonly { promptId: number; displayOrder: number }[]
  ): Promise<void>
}
