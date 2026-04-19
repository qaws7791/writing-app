import type { PromptId, UserId } from "../../shared/brand/index"
import type {
  CreatePromptInput,
  PromptBookmarkResult,
  PromptListFilters,
  PromptListPage,
  PromptSummary,
  UpdatePromptInput,
} from "./prompt-types"

export interface PromptRepository {
  list(
    userId: UserId | null,
    filters?: PromptListFilters
  ): Promise<PromptListPage>
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
  create(input: CreatePromptInput): Promise<PromptSummary>
  update(
    promptId: PromptId,
    input: UpdatePromptInput
  ): Promise<PromptSummary | null>
  delete(promptId: PromptId): Promise<void>
}
