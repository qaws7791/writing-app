import type { DraftContent } from "../schema/draft-content-schema"
import type { DraftId, PromptId, UserId } from "../brand/index"

// ============================================================================
// Result Types
// ============================================================================

export type DraftAccessResult =
  | { kind: "draft"; draft: DraftDetail }
  | { kind: "forbidden"; ownerId: UserId }
  | { kind: "not-found" }

export type DraftMutationResult =
  | { kind: "draft"; draft: DraftDetail }
  | { kind: "forbidden"; ownerId: UserId }
  | { kind: "not-found" }

export type DraftDeleteResult =
  | { kind: "deleted" }
  | { kind: "forbidden"; ownerId: UserId }
  | { kind: "not-found" }

// ============================================================================
// Value Objects
// ============================================================================

export type DraftSummary = {
  readonly characterCount: number
  readonly id: DraftId
  readonly lastSavedAt: string
  readonly preview: string
  readonly sourcePromptId: PromptId | null
  readonly title: string
  readonly wordCount: number
}

export type DraftDetail = DraftSummary & {
  readonly content: DraftContent
  readonly createdAt: string
  readonly updatedAt: string
}

export type DraftPersistInput = {
  readonly characterCount: number
  readonly content: DraftContent
  readonly plainText: string
  readonly sourcePromptId: PromptId | null
  readonly title: string
  readonly wordCount: number
}

// ============================================================================
// Port Interface
// ============================================================================

export interface DraftRepository {
  create(userId: UserId, input: DraftPersistInput): Promise<DraftDetail>
  delete(userId: UserId, draftId: DraftId): Promise<DraftDeleteResult>
  getById(userId: UserId, draftId: DraftId): Promise<DraftAccessResult>
  list(userId: UserId, limit?: number): Promise<readonly DraftSummary[]>
  replace(
    userId: UserId,
    draftId: DraftId,
    input: DraftPersistInput
  ): Promise<DraftMutationResult>
  resume(userId: UserId): Promise<DraftSummary | null>
}
