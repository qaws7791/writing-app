import type { WritingContent } from "@/domain/writing"

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

// --- Local Document ---

export type SyncStatus = "synced" | "pending" | "conflict"

export type LocalDocument = {
  writingId: number
  title: string
  content: WritingContent
  baseVersion: number
  localVersion: number
  lastModifiedAt: string
  syncStatus: SyncStatus
}

// --- Pending Transaction ---

export type PendingTransactionStatus = "pending" | "sending" | "failed"

export type PendingTransaction = {
  id?: number
  writingId: number
  baseVersion: number
  operations: Operation[]
  createdAt: string
  status: PendingTransactionStatus
}

// --- Local Version ---

export type LocalVersion = {
  id?: number
  writingId: number
  version: number
  title: string
  content: WritingContent
  createdAt: string
  source: "auto" | "server" | "restore"
}

// --- Sync Push/Pull ---

export type SyncPushRequest = {
  baseVersion: number
  transactions: {
    operations: Operation[]
    createdAt: string
  }[]
  restoreFrom?: number
  snapshotReason?: "manual"
}

export type SyncPushResponse =
  | { accepted: true; serverVersion: number }
  | {
      accepted: false
      serverVersion: number
      serverContent: WritingContent
      serverTitle: string
    }

export type SyncPullResponse = {
  version: number
  title: string
  content: WritingContent
  lastSavedAt: string
  hasNewerVersion: boolean
}

// --- Version History ---

export type VersionSummary = {
  id: number
  writingId: number
  version: number
  title: string
  createdAt: string
  reason: "auto" | "manual" | "restore"
}

export type VersionDetail = VersionSummary & {
  content: WritingContent
}

// --- Sync State ---

export type SyncState =
  | "idle"
  | "debouncing"
  | "syncing"
  | "retrying"
  | "resolving"
  | "error"
  | "offline"

// --- Multi-tab Messages ---

export type TabMessage =
  | { type: "LOCAL_CHANGE"; writingId: number; tabId: string }
  | { type: "SYNC_COMPLETE"; writingId: number; version: number; tabId: string }
  | { type: "LEADER_CLAIM"; tabId: string; timestamp: number }
  | { type: "LEADER_ACK"; tabId: string }
  | { type: "TAB_CLOSING"; tabId: string }
