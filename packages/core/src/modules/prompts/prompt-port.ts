import type { PromptId, UserId } from "../../shared/brand/index"
import type {
  PromptDetail,
  PromptListFilters,
  PromptSaveResult,
  PromptSummary,
} from "./prompt-types"

export interface PromptRepository {
  exists(promptId: PromptId): Promise<boolean>
  getById(userId: UserId, promptId: PromptId): Promise<PromptDetail | null>
  list(
    userId: UserId,
    filters: PromptListFilters
  ): Promise<readonly PromptSummary[]>
  listSaved(userId: UserId, limit?: number): Promise<readonly PromptSummary[]>
  listTodayPrompts(
    userId: UserId,
    limit: number
  ): Promise<readonly PromptSummary[]>
  save(userId: UserId, promptId: PromptId): Promise<PromptSaveResult>
  unsave(userId: UserId, promptId: PromptId): Promise<boolean>
}
