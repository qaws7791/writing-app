import type { WritingId, UserId } from "../../shared/brand/index"
import type {
  CursorPage,
  CursorPageParams,
} from "../../shared/pagination/index"
import type { WritingContent } from "../../shared/schema/index"
import type {
  Operation,
  PushWritePlan,
  StoredTransaction,
  Writing,
  WritingSyncAccessResult,
  WritingVersionDetail,
  WritingVersionSummary,
  WritingCrudAccessResult,
  WritingDeleteResult,
  WritingDetail,
  WritingMutationResult,
  WritingPersistInput,
  WritingSummary,
} from "./writing-types"

export interface WritingRepository {
  create(userId: UserId, input: WritingPersistInput): Promise<WritingDetail>
  delete(userId: UserId, writingId: WritingId): Promise<WritingDeleteResult>
  getById(
    userId: UserId,
    writingId: WritingId
  ): Promise<WritingCrudAccessResult>
  list(
    userId: UserId,
    params?: CursorPageParams
  ): Promise<CursorPage<WritingSummary>>
  replace(
    userId: UserId,
    writingId: WritingId,
    input: WritingPersistInput
  ): Promise<WritingMutationResult>
  resume(userId: UserId): Promise<WritingSummary | null>
}

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
    params?: CursorPageParams
  ): Promise<CursorPage<WritingVersionSummary>>

  getByVersion(
    writingId: WritingId,
    version: number
  ): Promise<WritingVersionDetail | null>
}
