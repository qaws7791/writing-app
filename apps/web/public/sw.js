/// <reference lib="webworker" />

/**
 * Background Sync Service Worker
 *
 * 오프라인 상태에서 큐에 쌓인 동기화 트랜잭션을
 * 네트워크가 복구되면 자동으로 서버에 전송한다.
 */

const SYNC_TAG = "writing-sync"
const DB_NAME = "writing-sync-db"
const DB_VERSION = 2
const STORE_NAME = "pendingTransactions"
const CONFIG_STORE_NAME = "config"

/** 메모리 캐시 (SW 생명주기 내 유지) */
let cachedApiBaseUrl = null

/** @type {ServiceWorkerGlobalScope} */
const sw = /** @type {any} */ (self)

sw.addEventListener("install", () => {
  sw.skipWaiting()
})

sw.addEventListener("activate", (event) => {
  event.waitUntil(sw.clients.claim())
})

// Background Sync API 이벤트
sw.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushPendingTransactions())
  }
})

// 메시지 핸들러 - 클라이언트에서 동기화 요청
sw.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_API_BASE_URL") {
    cachedApiBaseUrl = event.data.url
    saveApiBaseUrl(event.data.url)
    return
  }

  if (event.data && event.data.type === "REGISTER_SYNC") {
    // Background Sync 등록
    sw.registration.sync.register(SYNC_TAG).catch(() => {
      // Background Sync API 미지원 시 즉시 시도
      flushPendingTransactions()
    })
  }
})

async function flushPendingTransactions() {
  try {
    const apiBaseUrl = await loadApiBaseUrl()
    if (!apiBaseUrl) return

    const db = await openDb()
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const allRecords = await promisifyRequest(store.getAll())

    const pending = allRecords.filter(
      (r) => r.status === "pending" || r.status === "failed"
    )

    if (pending.length === 0) {
      db.close()
      return
    }

    // writingId 별로 그룹화
    const grouped = new Map()
    for (const record of pending) {
      const existing = grouped.get(record.writingId) || []
      existing.push(record)
      grouped.set(record.writingId, existing)
    }

    for (const [writingId, records] of grouped) {
      try {
        const baseVersion = records[0].baseVersion
        const transactions = records.map((r) => ({
          operations: r.operations,
          createdAt: r.createdAt,
        }))

        // API 호출
        const response = await fetch(
          `${apiBaseUrl}/writings/${writingId}/sync/push`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseVersion, transactions }),
          }
        )

        if (response.ok) {
          // 성공하면 해당 트랜잭션들 삭제
          const deleteTx = db.transaction(STORE_NAME, "readwrite")
          const deleteStore = deleteTx.objectStore(STORE_NAME)
          for (const record of records) {
            if (record.id != null) {
              deleteStore.delete(record.id)
            }
          }
          await promisifyTransaction(deleteTx)

          // 클라이언트에 알림
          const clients = await sw.clients.matchAll()
          for (const client of clients) {
            const result = await response.clone().json()
            client.postMessage({
              type: "SYNC_COMPLETE",
              writingId,
              version: result.serverVersion,
            })
          }
        }
      } catch {
        // 네트워크 실패 시 Background Sync가 다시 시도
      }
    }

    db.close()
  } catch {
    // DB 열기 실패 등은 무시
  }
}

// --- IndexedDB 유틸리티 ---

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
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

async function saveApiBaseUrl(url) {
  try {
    const db = await openDb()
    const tx = db.transaction(CONFIG_STORE_NAME, "readwrite")
    tx.objectStore(CONFIG_STORE_NAME).put({ key: "apiBaseUrl", value: url })
    await promisifyTransaction(tx)
    db.close()
  } catch {
    // 저장 실패 시 메모리 캐시만 사용
  }
}

async function loadApiBaseUrl() {
  if (cachedApiBaseUrl) return cachedApiBaseUrl
  try {
    const db = await openDb()
    const tx = db.transaction(CONFIG_STORE_NAME, "readonly")
    const record = await promisifyRequest(
      tx.objectStore(CONFIG_STORE_NAME).get("apiBaseUrl")
    )
    db.close()
    if (record?.value) {
      cachedApiBaseUrl = record.value
      return record.value
    }
  } catch {
    // 읽기 실패 시 null 반환
  }
  return null
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function promisifyTransaction(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
