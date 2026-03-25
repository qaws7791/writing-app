import type { DraftId, UserId } from "../../../shared/brand/index"
import type { DraftContent } from "../../../shared/schema/index"
import type {
  Writing,
  WritingAccessResult,
  StoredTransaction,
  WritingVersionDetail,
  WritingVersionSummary,
  Operation,
} from "../writing-types"
import type {
  WritingRepository,
  WritingTransactionRepository,
  WritingVersionRepository,
} from "../writing-port"

export function createFakeWritingRepository(
  initial?: Writing
): WritingRepository {
  const store = new Map<string, Writing>()

  if (initial) {
    store.set(`${initial.userId}:${initial.id}`, initial)
  }

  return {
    async getById(
      userId: UserId,
      draftId: DraftId
    ): Promise<WritingAccessResult> {
      const writing = store.get(`${userId}:${draftId}`)
      if (!writing) return { kind: "not-found" }
      if (writing.userId !== userId)
        return { kind: "forbidden", ownerId: writing.userId }
      return { kind: "writing", writing }
    },

    async updateWithVersion(userId, draftId, input) {
      const key = `${userId}:${draftId}`
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
      draftId: DraftId,
      userId: UserId,
      version: number,
      operations: Operation[],
      createdAt: string
    ): Promise<StoredTransaction> {
      const tx: StoredTransaction = {
        id: nextId++,
        draftId,
        userId,
        version,
        operations,
        createdAt,
      }
      transactions.push(tx)
      return tx
    },

    async listSince(
      draftId: DraftId,
      sinceVersion: number
    ): Promise<readonly StoredTransaction[]> {
      return transactions.filter(
        (tx) => tx.draftId === draftId && tx.version > sinceVersion
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
      draftId: DraftId
      userId: UserId
      version: number
      title: string
      content: DraftContent
      createdAt: string
      reason: "auto" | "manual" | "restore"
    }): Promise<WritingVersionDetail> {
      const detail: WritingVersionDetail = {
        id: nextId++,
        draftId: input.draftId,
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
      draftId: DraftId,
      limit?: number
    ): Promise<readonly WritingVersionSummary[]> {
      const filtered = versions
        .filter((v) => v.draftId === draftId)
        .sort((a, b) => b.version - a.version)

      const limited = limit ? filtered.slice(0, limit) : filtered

      return limited.map(({ content: _content, ...summary }) => summary)
    },

    async getByVersion(
      draftId: DraftId,
      version: number
    ): Promise<WritingVersionDetail | null> {
      return (
        versions.find((v) => v.draftId === draftId && v.version === version) ??
        null
      )
    },

    getAll() {
      return [...versions]
    },
  }
}
