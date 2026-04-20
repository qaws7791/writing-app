/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

type PendingTransactionRecord = {
  baseVersion: number
  createdAt: string
  id?: number
  operations: unknown[]
  status: "failed" | "pending" | string
  writingId: number
}

type ConfigRecord = {
  key: "apiBaseUrl"
  value: string
}

type ServiceWorkerMessage =
  | {
      type: "SET_API_BASE_URL"
      url: string
    }
  | {
      type: "REGISTER_SYNC"
    }

type SyncResponse = {
  serverVersion: number
}

type SyncRegistrationCapable = ServiceWorkerRegistration & {
  sync?: {
    register: (tag: string) => Promise<void>
  }
}

type SyncEvent = ExtendableEvent & {
  tag: string
}

const SYNC_TAG = "writing-sync"
const DB_NAME = "writing-sync-db"
const DB_VERSION = 2
const STORE_NAME = "pendingTransactions"
const CONFIG_STORE_NAME = "config"

const sw = self

sw.addEventListener("install", () => {
  void sw.skipWaiting()
})

sw.addEventListener("activate", (event) => {
  event.waitUntil(sw.clients.claim())
})

sw.addEventListener("sync", (event) => {
  const syncEvent = event as SyncEvent

  if (syncEvent.tag === SYNC_TAG) {
    syncEvent.waitUntil(flushPendingTransactions())
  }
})

sw.addEventListener("message", (event: ExtendableMessageEvent) => {
  const message = parseServiceWorkerMessage(event.data)
  if (message === null) {
    return
  }

  if (message.type === "SET_API_BASE_URL") {
    event.waitUntil(saveApiBaseUrl(message.url))
    return
  }

  event.waitUntil(registerSync())
})

async function registerSync() {
  const registration = sw.registration as SyncRegistrationCapable
  if (registration.sync === undefined) {
    await flushPendingTransactions()
    return
  }

  try {
    await registration.sync.register(SYNC_TAG)
  } catch {
    await flushPendingTransactions()
  }
}

async function flushPendingTransactions() {
  try {
    const apiBaseUrl = await loadApiBaseUrl()
    if (apiBaseUrl === null) {
      return
    }

    const db = await openDb()
    const pending = await loadPendingTransactions(db)

    if (pending.length === 0) {
      db.close()
      return
    }

    for (const [writingId, records] of groupPendingTransactions(pending)) {
      await flushWritingTransactions(db, apiBaseUrl, writingId, records)
    }

    db.close()
  } catch {
    return
  }
}

async function flushWritingTransactions(
  db: IDBDatabase,
  apiBaseUrl: string,
  writingId: number,
  records: PendingTransactionRecord[]
) {
  try {
    const baseVersion = records[0]?.baseVersion
    if (baseVersion === undefined) {
      return
    }

    const response = await fetch(
      `${apiBaseUrl}/writings/${writingId}/sync/push`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseVersion,
          transactions: records.map((record) => ({
            operations: record.operations,
            createdAt: record.createdAt,
          })),
        }),
      }
    )

    if (!response.ok) {
      return
    }

    const result = (await response.json()) as SyncResponse
    await deletePendingTransactions(db, records)
    await notifySyncComplete(writingId, result.serverVersion)
  } catch {
    return
  }
}

async function notifySyncComplete(writingId: number, serverVersion: number) {
  const clients = await sw.clients.matchAll()

  for (const client of clients) {
    client.postMessage({
      type: "SYNC_COMPLETE",
      writingId,
      version: serverVersion,
    })
  }
}

async function loadPendingTransactions(db: IDBDatabase) {
  const tx = db.transaction(STORE_NAME, "readonly")
  const store = tx.objectStore(STORE_NAME)
  const records = await promisifyRequest<PendingTransactionRecord[]>(
    store.getAll() as IDBRequest<PendingTransactionRecord[]>
  )

  return records.filter(
    (record) => record.status === "pending" || record.status === "failed"
  )
}

function groupPendingTransactions(records: PendingTransactionRecord[]) {
  const grouped = new Map<number, PendingTransactionRecord[]>()

  for (const record of records) {
    const existing = grouped.get(record.writingId) ?? []
    existing.push(record)
    grouped.set(record.writingId, existing)
  }

  return grouped
}

async function deletePendingTransactions(
  db: IDBDatabase,
  records: PendingTransactionRecord[]
) {
  const tx = db.transaction(STORE_NAME, "readwrite")
  const store = tx.objectStore(STORE_NAME)

  for (const record of records) {
    if (record.id !== undefined) {
      store.delete(record.id)
    }
  }

  await promisifyTransaction(tx)
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        })
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE_NAME)) {
        db.createObjectStore(CONFIG_STORE_NAME, { keyPath: "key" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveApiBaseUrl(url: string) {
  try {
    const db = await openDb()
    const tx = db.transaction(CONFIG_STORE_NAME, "readwrite")
    tx.objectStore(CONFIG_STORE_NAME).put({
      key: "apiBaseUrl",
      value: url,
    } satisfies ConfigRecord)
    await promisifyTransaction(tx)
    db.close()
  } catch {
    return
  }
}

async function loadApiBaseUrl(): Promise<string | null> {
  try {
    const db = await openDb()
    const tx = db.transaction(CONFIG_STORE_NAME, "readonly")
    const record = await promisifyRequest<ConfigRecord | undefined>(
      tx.objectStore(CONFIG_STORE_NAME).get("apiBaseUrl") as IDBRequest<
        ConfigRecord | undefined
      >
    )
    db.close()
    return record?.value ?? null
  } catch {
    return null
  }
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function promisifyTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function parseServiceWorkerMessage(
  value: unknown
): ServiceWorkerMessage | null {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return null
  }

  if (
    value.type === "SET_API_BASE_URL" &&
    "url" in value &&
    typeof value.url === "string"
  ) {
    return value as ServiceWorkerMessage
  }

  if (value.type === "REGISTER_SYNC") {
    return { type: "REGISTER_SYNC" }
  }

  return null
}
