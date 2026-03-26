import type { WritingId, UserId } from "../brand/index"
import type { CursorPage, CursorPageParams } from "../pagination/index"
import type {
  WritingCrudAccessResult,
  WritingDeleteResult,
  WritingDetail,
  WritingMutationResult,
  WritingPersistInput,
  WritingRepository,
  WritingSummary,
} from "../ports/index"

/**
 * In-memory fake WritingFull repository for testing.
 * Stores writings by userId and writingId.
 */
export class FakeWritingRepository implements WritingRepository {
  private storage = new Map<string, Map<number, WritingDetail>>()

  async create(
    userId: UserId,
    input: WritingPersistInput
  ): Promise<WritingDetail> {
    const userWritings = this.storage.get(userId) ?? new Map()
    const writingId = (Math.max(...userWritings.keys(), 0) + 1) as WritingId
    const now = new Date().toISOString()

    const writing: WritingDetail = {
      ...input,
      characterCount: input.characterCount,
      createdAt: now,
      id: writingId as unknown as number as WritingId,
      lastSavedAt: now,
      preview: input.plainText.slice(0, 100),
      updatedAt: now,
      wordCount: input.wordCount,
    }

    userWritings.set(writingId, writing)
    this.storage.set(userId, userWritings)
    return writing
  }

  async delete(
    userId: UserId,
    writingId: WritingId
  ): Promise<WritingDeleteResult> {
    const userWritings = this.storage.get(userId)
    const writing = userWritings?.get(writingId)

    if (!writing) {
      return { kind: "not-found" }
    }

    userWritings!.delete(writingId)
    return { kind: "deleted" }
  }

  async getById(
    userId: UserId,
    writingId: WritingId
  ): Promise<WritingCrudAccessResult> {
    const writing = this.storage.get(userId)?.get(writingId)

    if (!writing) {
      return { kind: "not-found" }
    }

    return { kind: "writing", writing }
  }

  async list(
    userId: UserId,
    params?: CursorPageParams
  ): Promise<CursorPage<WritingSummary>> {
    const userWritings = this.storage.get(userId) ?? new Map()
    const writings = Array.from(userWritings.values()) as WritingSummary[]
    const limit = params?.limit
    const items = limit ? writings.slice(0, limit) : writings
    return { items, nextCursor: null, hasMore: false }
  }

  async replace(
    userId: UserId,
    writingId: WritingId,
    input: WritingPersistInput
  ): Promise<WritingMutationResult> {
    const userWritings = this.storage.get(userId)
    const existing = userWritings?.get(writingId)

    if (!existing) {
      return { kind: "not-found" }
    }

    const updated: WritingDetail = {
      ...existing,
      ...input,
      id: writingId,
      updatedAt: new Date().toISOString(),
    }

    userWritings!.set(writingId, updated)
    return { kind: "writing", writing: updated }
  }

  async resume(userId: UserId): Promise<WritingSummary | null> {
    const userWritings = this.storage.get(userId) ?? new Map()
    const writings = Array.from(userWritings.values())
    return writings.length > 0 ? writings[0] : null
  }

  clear(): void {
    this.storage.clear()
  }
}
