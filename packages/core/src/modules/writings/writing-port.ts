import type { WritingId, UserId } from "../../shared/brand/index"
import type { WritingContent } from "../../shared/schema/index"
import type {
  Operation,
  PushWritePlan,
  StoredTransaction,
  Writing,
  WritingSyncAccessResult,
  WritingVersionDetail,
  WritingVersionSummary,
} from "./writing-types"

// Re-export CRUD repository
export type { WritingRepository } from "./writing-crud-port"

export interface WritingSyncRepository {
  getById(
    userId: UserId,
    writingId: WritingId
  ): Promise<WritingSyncAccessResult>

  updateWithVersion(
    userId: UserId,
    writingId: WritingId,
    input: {
      content: WritingContent
      title: string
      plainText: string
      characterCount: number
      wordCount: number
      version: number
    }
  ): Promise<
    | { kind: "updated"; writing: Writing }
    | { kind: "not-found" }
    | { kind: "forbidden"; ownerId: UserId }
    | { kind: "version-conflict"; currentVersion: number }
  >
}

export interface WritingTransactionRepository {
  append(
    writingId: WritingId,
    userId: UserId,
    version: number,
    operations: Operation[],
    createdAt: string
  ): Promise<StoredTransaction>

  listSince(
    writingId: WritingId,
    sinceVersion: number
  ): Promise<readonly StoredTransaction[]>
}

export interface WritingSyncWriter {
  persistPush(
    plan: PushWritePlan
  ): Promise<
    | { kind: "updated"; writing: Writing }
    | { kind: "not-found" }
    | { kind: "forbidden"; ownerId: UserId }
    | { kind: "version-conflict"; currentVersion: number }
  >
}

export interface WritingVersionRepository {
  create(input: {
    writingId: WritingId
    userId: UserId
    version: number
    title: string
    content: WritingContent
    createdAt: string
    reason: "auto" | "manual" | "restore"
  }): Promise<WritingVersionDetail>

  list(
    writingId: WritingId,
    limit?: number
  ): Promise<readonly WritingVersionSummary[]>

  getByVersion(
    writingId: WritingId,
    version: number
  ): Promise<WritingVersionDetail | null>
}
