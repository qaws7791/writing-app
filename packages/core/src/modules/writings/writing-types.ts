import type { DraftContent } from "../../shared/schema/index"
import type { DraftId, UserId } from "../../shared/brand/index"

// --- Operation (Delta) ---

export type SetTitleOperation = {
  readonly type: "setTitle"
  readonly title: string
}

export type SetContentOperation = {
  readonly type: "setContent"
  readonly content: DraftContent
}

export type Operation = SetTitleOperation | SetContentOperation

// --- Transaction ---

export type WritingTransaction = {
  readonly operations: Operation[]
  readonly createdAt: string
}

// --- Writing (Document) ---

export type Writing = {
  readonly id: DraftId
  readonly userId: UserId
  readonly version: number
  readonly title: string
  readonly content: DraftContent
  readonly plainText: string
  readonly characterCount: number
  readonly wordCount: number
  readonly createdAt: string
  readonly updatedAt: string
  readonly lastSavedAt: string
}

export type WritingAccessResult =
  | { kind: "writing"; writing: Writing }
  | { kind: "forbidden"; ownerId: UserId }
  | { kind: "not-found" }

// --- Sync Push/Pull ---

export type SyncPushInput = {
  readonly baseVersion: number
  readonly transactions: WritingTransaction[]
  readonly restoreFrom?: number
}

export type SyncPushAccepted = {
  readonly accepted: true
  readonly serverVersion: number
}

export type SyncPushConflict = {
  readonly accepted: false
  readonly serverVersion: number
  readonly serverContent: DraftContent
  readonly serverTitle: string
}

export type SyncPushResult = SyncPushAccepted | SyncPushConflict

export type SyncPullResult = {
  readonly version: number
  readonly title: string
  readonly content: DraftContent
  readonly lastSavedAt: string
  readonly hasNewerVersion: boolean
}

// --- Version History ---

export type WritingVersionSummary = {
  readonly id: number
  readonly draftId: DraftId
  readonly version: number
  readonly title: string
  readonly createdAt: string
  readonly reason: "auto" | "manual" | "restore"
}

export type WritingVersionDetail = WritingVersionSummary & {
  readonly content: DraftContent
}

// --- Stored Transaction ---

export type StoredTransaction = {
  readonly id: number
  readonly draftId: DraftId
  readonly userId: UserId
  readonly version: number
  readonly operations: Operation[]
  readonly createdAt: string
}
