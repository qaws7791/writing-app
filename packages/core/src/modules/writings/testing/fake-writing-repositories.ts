import type { WritingId, UserId } from "../../../shared/brand/index"
import type { WritingContent } from "../../../shared/schema/index"
import type {
  Writing,
  WritingSyncAccessResult,
  StoredTransaction,
  WritingVersionDetail,
  WritingVersionSummary,
  Operation,
} from "../writing-types"
import type {
  WritingSyncRepository,
  WritingTransactionRepository,
  WritingVersionRepository,
} from "../writing-port"

export function createFakeWritingSyncRepository(
  initial?: Writing
): WritingSyncRepository {
  const store = new Map<string, Writing>()

  if (initial) {
    store.set(`${initial.userId}:${initial.id}`, initial)
  }

  return {
    async getById(
      userId: UserId,
      writingId: WritingId
    ): Promise<WritingSyncAccessResult> {
      const writing = store.get(`${userId}:${writingId}`)
      if (!writing) return { kind: "not-found" }
      if (writing.userId !== userId)
        return { kind: "forbidden", ownerId: writing.userId }
      return { kind: "writing", writing }
    },

    async updateWithVersion(userId, writingId, input) {
      const key = `${userId}:${writingId}`
      const writing = store.get(key)
      if (!writing) return { kind: "not-found" as const }
      if (writing.userId !== userId)
        return { kind: "forbidden" as const, ownerId: writing.userId }

      const updated: Writing = {
        ...writing,
        content: input.content,
        title: input.title,
        plainText: input.plainText,
        characterCount: input.characterCount,
        wordCount: input.wordCount,
        version: input.version,
        updatedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
      }

      store.set(key, updated)
      return { kind: "updated" as const, writing: updated }
    },
  }
}

export function createFakeTransactionRepository(): WritingTransactionRepository & {
  getAll(): StoredTransaction[]
} {
  const transactions: StoredTransaction[] = []
  let nextId = 1

  return {
    async append(
      writingId: WritingId,
      userId: UserId,
      version: number,
      operations: Operation[],
      createdAt: string
    ): Promise<StoredTransaction> {
      const tx: StoredTransaction = {
        id: nextId++,
        writingId,
        userId,
        version,
        operations,
        createdAt,
      }
      transactions.push(tx)
      return tx
    },

    async listSince(
      writingId: WritingId,
      sinceVersion: number
    ): Promise<readonly StoredTransaction[]> {
      return transactions.filter(
        (tx) => tx.writingId === writingId && tx.version > sinceVersion
      )
    },

    getAll() {
      return [...transactions]
    },
  }
}

export function createFakeVersionRepository(): WritingVersionRepository & {
  getAll(): WritingVersionDetail[]
} {
  const versions: WritingVersionDetail[] = []
  let nextId = 1

  return {
    async create(input: {
      writingId: WritingId
      userId: UserId
      version: number
      title: string
      content: WritingContent
      createdAt: string
      reason: "auto" | "manual" | "restore"
    }): Promise<WritingVersionDetail> {
      const detail: WritingVersionDetail = {
        id: nextId++,
        writingId: input.writingId,
        version: input.version,
        title: input.title,
        content: input.content,
        createdAt: input.createdAt,
        reason: input.reason,
      }
      versions.push(detail)
      return detail
    },

    async list(
      writingId: WritingId,
      limit?: number
    ): Promise<readonly WritingVersionSummary[]> {
      const filtered = versions
        .filter((v) => v.writingId === writingId)
        .sort((a, b) => b.version - a.version)

      const limited = limit ? filtered.slice(0, limit) : filtered

      return limited.map(({ content: _content, ...summary }) => summary)
    },

    async getByVersion(
      writingId: WritingId,
      version: number
    ): Promise<WritingVersionDetail | null> {
      return (
        versions.find(
          (v) => v.writingId === writingId && v.version === version
        ) ?? null
      )
    },

    getAll() {
      return [...versions]
    },
  }
}
