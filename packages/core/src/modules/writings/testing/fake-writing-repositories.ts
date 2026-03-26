import type { WritingId, UserId } from "../../../shared/brand/index"
import type {
  CursorPage,
  CursorPageParams,
} from "../../../shared/pagination/index"
import type { WritingContent } from "../../../shared/schema/index"
import type {
  Writing,
  WritingSyncAccessResult,
  StoredTransaction,
  WritingVersionDetail,
  WritingVersionSummary,
  Operation,
  PushWritePlan,
} from "../writing-types"
import type {
  WritingSyncRepository,
  WritingSyncWriter,
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
      params?: CursorPageParams
    ): Promise<CursorPage<WritingVersionSummary>> {
      const filtered = versions
        .filter((v) => v.writingId === writingId)
        .sort((a, b) => b.version - a.version)

      const limit = params?.limit
      const limited = limit ? filtered.slice(0, limit) : filtered

      const items = limited.map(({ content: _content, ...summary }) => summary)
      return { items, nextCursor: null, hasMore: false }
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

export function createFakeWritingSyncWriter(
  syncRepository: WritingSyncRepository
): WritingSyncWriter & {
  getTransactions(): StoredTransaction[]
  getVersionSnapshots(): WritingVersionDetail[]
} {
  const transactions: StoredTransaction[] = []
  const snapshots: WritingVersionDetail[] = []
  let nextTxId = 1
  let nextSnapshotId = 1

  return {
    async persistPush(plan: PushWritePlan) {
      const updateResult = await syncRepository.updateWithVersion(
        plan.writing.userId,
        plan.writing.writingId,
        {
          content: plan.writing.content,
          title: plan.writing.title,
          plainText: plan.writing.plainText,
          characterCount: plan.writing.characterCount,
          wordCount: plan.writing.wordCount,
          version: plan.writing.version,
        }
      )

      if (updateResult.kind !== "updated") {
        return updateResult
      }

      for (const entry of plan.transactions) {
        transactions.push({
          id: nextTxId++,
          writingId: entry.writingId,
          userId: entry.userId,
          version: entry.version,
          operations: entry.operations,
          createdAt: entry.createdAt,
        })
      }

      if (plan.versionSnapshot) {
        snapshots.push({
          id: nextSnapshotId++,
          writingId: plan.versionSnapshot.writingId,
          version: plan.versionSnapshot.version,
          title: plan.versionSnapshot.title,
          content: plan.versionSnapshot.content,
          createdAt: plan.versionSnapshot.createdAt,
          reason: plan.versionSnapshot.reason,
        })
      }

      return updateResult
    },

    getTransactions() {
      return [...transactions]
    },

    getVersionSnapshots() {
      return [...snapshots]
    },
  }
}
