import type { PromptId, UserId } from "../../shared/brand/index"
import type {
  PromptBookmarkResult,
  PromptListFilters,
  PromptSummary,
} from "./prompt-types"

export interface PromptRepository {
  list(
    userId: UserId | null,
    filters?: PromptListFilters
  ): Promise<PromptSummary[]>
  getById(
    promptId: PromptId,
    userId: UserId | null
  ): Promise<PromptSummary | null>
  getDailyPrompt(
    userId: UserId | null,
    dateKey: string
  ): Promise<PromptSummary | null>
  bookmark(userId: UserId, promptId: PromptId): Promise<PromptBookmarkResult>
  unbookmark(userId: UserId, promptId: PromptId): Promise<void>
}
