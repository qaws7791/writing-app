import type { DraftId, UserId } from "../../shared/brand/index"
import type { DraftContent } from "../../shared/schema/index"
import type {
  Operation,
  StoredTransaction,
  Writing,
  WritingAccessResult,
  WritingVersionDetail,
  WritingVersionSummary,
} from "./writing-types"

export interface WritingRepository {
  getById(userId: UserId, draftId: DraftId): Promise<WritingAccessResult>

  updateWithVersion(
    userId: UserId,
    draftId: DraftId,
    input: {
      content: DraftContent
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
    draftId: DraftId,
    userId: UserId,
    version: number,
    operations: Operation[],
    createdAt: string
  ): Promise<StoredTransaction>

  listSince(
    draftId: DraftId,
    sinceVersion: number
  ): Promise<readonly StoredTransaction[]>
}

export interface WritingVersionRepository {
  create(input: {
    draftId: DraftId
    userId: UserId
    version: number
    title: string
    content: DraftContent
    createdAt: string
    reason: "auto" | "manual" | "restore"
  }): Promise<WritingVersionDetail>

  list(
    draftId: DraftId,
    limit?: number
  ): Promise<readonly WritingVersionSummary[]>

  getByVersion(
    draftId: DraftId,
    version: number
  ): Promise<WritingVersionDetail | null>
}
