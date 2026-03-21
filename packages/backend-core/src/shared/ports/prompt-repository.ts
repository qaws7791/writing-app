import type { DraftId, PromptId, UserId } from "../brand/index"
import type { PromptLevel, PromptTopic } from "../schema/index"

// ============================================================================
// Result Types
// ============================================================================

export type PromptSaveResult =
  | { kind: "saved"; savedAt: string }
  | { kind: "not-found" }

export type PromptListFilters = {
  level?: PromptLevel
  query?: string
  saved?: boolean
  topic?: PromptTopic
}

// ============================================================================
// Value Objects
// ============================================================================

export type PromptSummary = {
  readonly id: PromptId
  readonly level: number
  readonly saved: boolean
  readonly suggestedLengthLabel: string
  readonly tags: readonly string[]
  readonly text: string
  readonly topic: string
}

export type PromptDetail = PromptSummary & {
  readonly description: string
  readonly outline: readonly string[]
  readonly tips: readonly string[]
}

// ============================================================================
// Port Interface
// ============================================================================

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
