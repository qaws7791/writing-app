import type { DraftContent } from "../../shared/schema/index"
import type { DraftId, PromptId, UserId } from "../../shared/brand/index"

export type Draft = {
  readonly characterCount: number
  readonly content: DraftContent
  readonly createdAt: string
  readonly id: DraftId
  readonly lastSavedAt: string
  readonly plainText: string
  readonly preview: string
  readonly sourcePromptId: PromptId | null
  readonly title: string
  readonly updatedAt: string
  readonly wordCount: number
}

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
