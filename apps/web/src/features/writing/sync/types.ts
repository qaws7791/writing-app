import type { DraftContent } from "@workspace/core"

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

// --- Local Document ---

export type SyncStatus = "synced" | "pending" | "conflict"

export type LocalDocument = {
  draftId: number
  title: string
  content: DraftContent
  baseVersion: number
  localVersion: number
  lastModifiedAt: string
  syncStatus: SyncStatus
}

// --- Pending Transaction ---

export type PendingTransactionStatus = "pending" | "sending" | "failed"

export type PendingTransaction = {
  id?: number
  draftId: number
  baseVersion: number
  operations: Operation[]
  createdAt: string
  status: PendingTransactionStatus
}

// --- Local Version ---

export type LocalVersion = {
  id?: number
  draftId: number
  version: number
  title: string
  content: DraftContent
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
      serverContent: DraftContent
      serverTitle: string
    }

export type SyncPullResponse = {
  version: number
  title: string
  content: DraftContent
  lastSavedAt: string
  hasNewerVersion: boolean
}

// --- Version History ---

export type VersionSummary = {
  id: number
  draftId: number
  version: number
  title: string
  createdAt: string
  reason: "auto" | "manual" | "restore"
}

export type VersionDetail = VersionSummary & {
  content: DraftContent
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
  | { type: "LOCAL_CHANGE"; draftId: number; tabId: string }
  | { type: "SYNC_COMPLETE"; draftId: number; version: number; tabId: string }
  | { type: "LEADER_CLAIM"; tabId: string; timestamp: number }
  | { type: "LEADER_ACK"; tabId: string }
  | { type: "TAB_CLOSING"; tabId: string }
