/// <reference lib="webworker" />

/**
 * Background Sync Service Worker
 *
 * 오프라인 상태에서 큐에 쌓인 동기화 트랜잭션을
 * 네트워크가 복구되면 자동으로 서버에 전송한다.
 */

const SYNC_TAG = "writing-sync"
const DB_NAME = "writing-sync-db"
const STORE_NAME = "pendingTransactions"

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

    // draftId 별로 그룹화
    const grouped = new Map()
    for (const record of pending) {
      const existing = grouped.get(record.draftId) || []
      existing.push(record)
      grouped.set(record.draftId, existing)
    }

    for (const [draftId, records] of grouped) {
      try {
        const baseVersion = records[0].baseVersion
        const transactions = records.map((r) => ({
          operations: r.operations,
          createdAt: r.createdAt,
        }))

        // API 호출
        const response = await fetch(`/api/writings/${draftId}/sync/push`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseVersion, transactions }),
        })

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
              draftId,
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
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
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
