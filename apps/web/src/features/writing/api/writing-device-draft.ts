export type WritingDeviceDraft = Readonly<{
  baseVersion: number
  body: string
  checksum: string
  learnerId: string
  savedAt: number
  writingId: string
}>

export type WritingDraftStore = {
  readonly clearAll: () => Promise<void>
  readonly delete: (learnerId: string, writingId: string) => Promise<void>
  readonly deleteByWritingId: (writingId: string) => Promise<void>
  readonly get: (
    learnerId: string,
    writingId: string
  ) => Promise<WritingDeviceDraft | null>
  readonly put: (draft: WritingDeviceDraft) => Promise<void>
}

export type WritingDeviceDraftDecision =
  | Readonly<{ kind: "conflict"; draft: WritingDeviceDraft }>
  | Readonly<{ kind: "discard-corrupt" }>
  | Readonly<{ kind: "recover"; draft: WritingDeviceDraft }>
  | Readonly<{ kind: "server" }>

function createWritingDraftKey(learnerId: string, writingId: string): string {
  return `${learnerId}:${writingId}`
}

export async function hashWritingDraftBody(body: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body)
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}

export function readWritingDeviceDraftDecision(input: {
  readonly local: WritingDeviceDraft | "corrupt" | null
  readonly serverBody: string
  readonly serverVersion: number
}): WritingDeviceDraftDecision {
  if (input.local === "corrupt") return { kind: "discard-corrupt" }
  if (input.local === null || input.local.body === input.serverBody) {
    return { kind: "server" }
  }
  if (input.local.baseVersion === input.serverVersion) {
    return { kind: "recover", draft: input.local }
  }
  if (input.local.baseVersion < input.serverVersion) {
    return { kind: "conflict", draft: input.local }
  }
  return { kind: "recover", draft: input.local }
}

export function createMemoryWritingDraftStore(
  initial: readonly WritingDeviceDraft[] = []
): WritingDraftStore {
  const drafts = new Map<string, WritingDeviceDraft>()
  for (const draft of initial) {
    drafts.set(createWritingDraftKey(draft.learnerId, draft.writingId), draft)
  }

  return {
    async clearAll() {
      drafts.clear()
    },
    async delete(learnerId, writingId) {
      drafts.delete(createWritingDraftKey(learnerId, writingId))
    },
    async deleteByWritingId(writingId) {
      for (const [key, draft] of drafts) {
        if (draft.writingId === writingId) drafts.delete(key)
      }
    },
    async get(learnerId, writingId) {
      return drafts.get(createWritingDraftKey(learnerId, writingId)) ?? null
    },
    async put(draft) {
      drafts.set(createWritingDraftKey(draft.learnerId, draft.writingId), draft)
    },
  }
}

export function getWritingDraftStore(): WritingDraftStore {
  writingDraftStore ??= createIndexedDbWritingDraftStore()
  return writingDraftStore
}

function createIndexedDbWritingDraftStore(): WritingDraftStore {
  return {
    async clearAll() {
      const db = await openWritingDraftDatabase()
      try {
        await runWritingDraftStore(db, "readwrite", (store) => store.clear())
      } finally {
        db.close()
      }
    },
    async delete(learnerId, writingId) {
      const db = await openWritingDraftDatabase()
      try {
        await runWritingDraftStore(db, "readwrite", (store) =>
          store.delete(createWritingDraftKey(learnerId, writingId))
        )
      } finally {
        db.close()
      }
    },
    async deleteByWritingId(writingId) {
      const db = await openWritingDraftDatabase()
      try {
        const drafts = await readAllWritingDrafts(db)
        await Promise.all(
          drafts
            .filter((draft) => draft.writingId === writingId)
            .map((draft) =>
              runWritingDraftStore(db, "readwrite", (store) =>
                store.delete(
                  createWritingDraftKey(draft.learnerId, draft.writingId)
                )
              )
            )
        )
      } finally {
        db.close()
      }
    },
    async get(learnerId, writingId) {
      const db = await openWritingDraftDatabase()
      try {
        const value = await runWritingDraftStore(db, "readonly", (store) =>
          store.get(createWritingDraftKey(learnerId, writingId))
        )
        return parseWritingDeviceDraft(value)
      } finally {
        db.close()
      }
    },
    async put(draft) {
      await putWritingDeviceDraft(draft)
    },
  }
}

export async function requestWritingDraftPersistence(): Promise<void> {
  if (
    typeof navigator === "undefined" ||
    navigator.storage?.persist === undefined
  ) {
    return
  }
  try {
    await navigator.storage.persist()
  } catch {
    return
  }
}

async function putWritingDeviceDraft(draft: WritingDeviceDraft): Promise<void> {
  const db = await openWritingDraftDatabase()
  try {
    await runWritingDraftStore(db, "readwrite", (store) =>
      store.put(draft, createWritingDraftKey(draft.learnerId, draft.writingId))
    )
  } catch (error) {
    if (!isQuotaExceededError(error)) throw error
    await evictOldestWritingDraft(
      db,
      createWritingDraftKey(draft.learnerId, draft.writingId)
    )
    await runWritingDraftStore(db, "readwrite", (store) =>
      store.put(draft, createWritingDraftKey(draft.learnerId, draft.writingId))
    )
  } finally {
    db.close()
  }
}

async function evictOldestWritingDraft(
  db: IDBDatabase,
  keepKey: string
): Promise<void> {
  const drafts = await readAllWritingDrafts(db)
  const oldest = drafts
    .filter(
      (draft) =>
        createWritingDraftKey(draft.learnerId, draft.writingId) !== keepKey
    )
    .slice()
    .sort((left, right) => left.savedAt - right.savedAt)[0]
  if (oldest === undefined) return
  await runWritingDraftStore(db, "readwrite", (store) =>
    store.delete(createWritingDraftKey(oldest.learnerId, oldest.writingId))
  )
}

function openWritingDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(writingDraftDatabaseName, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(writingDraftStoreName)) {
        database.createObjectStore(writingDraftStoreName)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function runWritingDraftStore<TValue>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<TValue>
): Promise<TValue> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(writingDraftStoreName, mode)
    const request = run(transaction.objectStore(writingDraftStoreName))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function readAllWritingDrafts(db: IDBDatabase): Promise<WritingDeviceDraft[]> {
  return runWritingDraftStore(db, "readonly", (store) => store.getAll()).then(
    (values) =>
      values.flatMap((value) => {
        const draft = parseWritingDeviceDraft(value)
        return draft === null ? [] : [draft]
      })
  )
}

function parseWritingDeviceDraft(value: unknown): WritingDeviceDraft | null {
  if (typeof value !== "object" || value === null) return null
  const record = value as Record<string, unknown>
  if (
    typeof record.baseVersion !== "number" ||
    typeof record.body !== "string" ||
    typeof record.checksum !== "string" ||
    typeof record.learnerId !== "string" ||
    typeof record.savedAt !== "number" ||
    typeof record.writingId !== "string"
  ) {
    return null
  }
  return {
    baseVersion: record.baseVersion,
    body: record.body,
    checksum: record.checksum,
    learnerId: record.learnerId,
    savedAt: record.savedAt,
    writingId: record.writingId,
  }
}

function isQuotaExceededError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "QuotaExceededError"
}

const writingDraftDatabaseName = "writing-app-writing-drafts"
const writingDraftStoreName = "drafts"
let writingDraftStore: WritingDraftStore | undefined
