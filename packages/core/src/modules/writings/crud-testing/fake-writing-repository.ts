import type { WritingId, UserId } from "../../../shared/brand/index"
import type {
  CursorPage,
  CursorPageParams,
} from "../../../shared/pagination/index"
import type {
  WritingCrudAccessResult,
  WritingDeleteResult,
  WritingDetail,
  WritingMutationResult,
  WritingPersistInput,
  WritingSummary,
} from "../writing-types"
import type { WritingRepository } from "../writing-crud-port"

export function createFakeWritingRepository(): WritingRepository & {
  clear(): void
} {
  const storage = new Map<string, Map<number, WritingDetail>>()

  return {
    async create(
      userId: UserId,
      input: WritingPersistInput
    ): Promise<WritingDetail> {
      const userWritings = storage.get(userId) ?? new Map()
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
      storage.set(userId, userWritings)
      return writing
    },

    async delete(
      userId: UserId,
      writingId: WritingId
    ): Promise<WritingDeleteResult> {
      const userWritings = storage.get(userId)
      const writing = userWritings?.get(writingId)

      if (!writing) return { kind: "not-found" }

      userWritings!.delete(writingId)
      return { kind: "deleted" }
    },

    async getById(
      userId: UserId,
      writingId: WritingId
    ): Promise<WritingCrudAccessResult> {
      const writing = storage.get(userId)?.get(writingId)

      if (!writing) return { kind: "not-found" }

      return { kind: "writing", writing }
    },

    async list(
      userId: UserId,
      params?: CursorPageParams
    ): Promise<CursorPage<WritingSummary>> {
      const userWritings = storage.get(userId) ?? new Map()
      const writings = Array.from(userWritings.values()) as WritingSummary[]
      const limit = params?.limit
      const items = limit ? writings.slice(0, limit) : writings
      return { items, nextCursor: null, hasMore: false }
    },

    async replace(
      userId: UserId,
      writingId: WritingId,
      input: WritingPersistInput
    ): Promise<WritingMutationResult> {
      const userWritings = storage.get(userId)
      const existing = userWritings?.get(writingId)

      if (!existing) return { kind: "not-found" }

      const updated: WritingDetail = {
        ...existing,
        ...input,
        id: writingId,
        updatedAt: new Date().toISOString(),
      }

      userWritings!.set(writingId, updated)
      return { kind: "writing", writing: updated }
    },

    async resume(userId: UserId): Promise<WritingSummary | null> {
      const userWritings = storage.get(userId) ?? new Map()
      const writings = Array.from(userWritings.values())
      return writings.length > 0 ? writings[0] : null
    },

    clear(): void {
      storage.clear()
    },
  }
}
