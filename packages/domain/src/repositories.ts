import type { DraftId, PromptId, UserId } from "./brand.js"
import type {
  DraftAccessResult,
  DraftDeleteResult,
  DraftDetail,
  DraftMutationResult,
  DraftPersistInput,
  DraftSummary,
  PromptDetail,
  PromptListFilters,
  PromptSaveResult,
  PromptSummary,
} from "./entities.js"

export interface PromptRepository {
  exists(promptId: PromptId): Promise<boolean>
  getById(userId: UserId, promptId: PromptId): Promise<PromptDetail | null>
  list(userId: UserId, filters: PromptListFilters): Promise<PromptSummary[]>
  listSaved(userId: UserId, limit?: number): Promise<PromptSummary[]>
  listTodayPrompts(userId: UserId, limit: number): Promise<PromptSummary[]>
  save(userId: UserId, promptId: PromptId): Promise<PromptSaveResult>
  unsave(userId: UserId, promptId: PromptId): Promise<boolean>
}

export interface DraftRepository {
  create(userId: UserId, input: DraftPersistInput): Promise<DraftDetail>
  delete(userId: UserId, draftId: DraftId): Promise<DraftDeleteResult>
  getById(userId: UserId, draftId: DraftId): Promise<DraftAccessResult>
  list(userId: UserId, limit?: number): Promise<DraftSummary[]>
  replace(
    userId: UserId,
    draftId: DraftId,
    input: DraftPersistInput
  ): Promise<DraftMutationResult>
  resume(userId: UserId): Promise<DraftSummary | null>
}

export interface UserSeedRepository {
  ensureDevUser(userId: UserId, nickname: string): Promise<void>
}
