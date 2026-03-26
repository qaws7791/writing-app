import type { WritingContent } from "../../shared/schema/index"
import type { WritingId, PromptId, UserId } from "../../shared/brand/index"

// --- Operation (Delta) ---

export type SetTitleOperation = {
  readonly type: "setTitle"
  readonly title: string
}

export type SetContentOperation = {
  readonly type: "setContent"
  readonly content: WritingContent
}

export type Operation = SetTitleOperation | SetContentOperation

// --- Transaction ---

export type WritingTransaction = {
  readonly operations: Operation[]
  readonly createdAt: string
}

// --- Writing (Document) ---

export type Writing = {
  readonly id: WritingId
  readonly userId: UserId
  readonly version: number
  readonly title: string
  readonly content: WritingContent
  readonly plainText: string
  readonly characterCount: number
  readonly wordCount: number
  readonly createdAt: string
  readonly updatedAt: string
  readonly lastSavedAt: string
}

export type WritingSyncAccessResult =
  | { kind: "writing"; writing: Writing }
  | { kind: "forbidden"; ownerId: UserId }
  | { kind: "not-found" }

// --- Sync Push/Pull ---

export type SnapshotReason = "auto" | "manual" | "restore"

export type SyncPushInput = {
  readonly baseVersion: number
  readonly transactions: WritingTransaction[]
  readonly restoreFrom?: number
  readonly snapshotReason?: "manual"
}

export type SyncPushAccepted = {
  readonly accepted: true
  readonly serverVersion: number
}

export type SyncPushConflict = {
  readonly accepted: false
  readonly serverVersion: number
  readonly serverContent: WritingContent
  readonly serverTitle: string
}

export type SyncPushResult = SyncPushAccepted | SyncPushConflict

export type SyncPullResult = {
  readonly version: number
  readonly title: string
  readonly content: WritingContent
  readonly lastSavedAt: string
  readonly hasNewerVersion: boolean
}

// --- Version History ---

export type WritingVersionSummary = {
  readonly id: number
  readonly writingId: WritingId
  readonly version: number
  readonly title: string
  readonly createdAt: string
  readonly reason: "auto" | "manual" | "restore"
}

export type WritingVersionDetail = WritingVersionSummary & {
  readonly content: WritingContent
}

// --- Push Write Plan ---

export type PushWritePlanTransaction = {
  readonly writingId: WritingId
  readonly userId: UserId
  readonly version: number
  readonly operations: Operation[]
  readonly createdAt: string
}

export type PushWritePlanWriting = {
  readonly userId: UserId
  readonly writingId: WritingId
  readonly content: WritingContent
  readonly title: string
  readonly plainText: string
  readonly characterCount: number
  readonly wordCount: number
  readonly version: number
}

export type PushWritePlanSnapshot = {
  readonly writingId: WritingId
  readonly userId: UserId
  readonly version: number
  readonly title: string
  readonly content: WritingContent
  readonly createdAt: string
  readonly reason: SnapshotReason
}

export type PushWritePlan = {
  readonly transactions: readonly PushWritePlanTransaction[]
  readonly writing: PushWritePlanWriting
  readonly versionSnapshot?: PushWritePlanSnapshot
}

// --- Stored Transaction ---

export type StoredTransaction = {
  readonly id: number
  readonly writingId: WritingId
  readonly userId: UserId
  readonly version: number
  readonly operations: Operation[]
  readonly createdAt: string
}

// --- CRUD Types ---

export type WritingSummary = {
  readonly characterCount: number
  readonly id: WritingId
  readonly lastSavedAt: string
  readonly preview: string
  readonly sourcePromptId: PromptId | null
  readonly title: string
  readonly wordCount: number
}

export type WritingDetail = WritingSummary & {
  readonly content: WritingContent
  readonly createdAt: string
  readonly updatedAt: string
}

export type WritingPersistInput = {
  readonly characterCount: number
  readonly content: WritingContent
  readonly plainText: string
  readonly sourcePromptId: PromptId | null
  readonly title: string
  readonly wordCount: number
}

export type WritingCrudAccessResult =
  | { kind: "writing"; writing: WritingDetail }
  | { kind: "forbidden"; ownerId: UserId }
  | { kind: "not-found" }

export type WritingMutationResult =
  | { kind: "writing"; writing: WritingDetail }
  | { kind: "forbidden"; ownerId: UserId }
  | { kind: "not-found" }

export type WritingDeleteResult =
  | { kind: "deleted" }
  | { kind: "forbidden"; ownerId: UserId }
  | { kind: "not-found" }

export type WritingFull = WritingDetail & {
  readonly plainText: string
}
