import { createActor } from "xstate"
import type { WritingContent } from "@workspace/core"

import { syncMachine } from "./sync-machine"
import { type SyncTransport, SyncTransportError } from "./sync-transport"
import {
  deletePendingTransactions,
  enqueuePendingTransaction,
  getDocument,
  getPendingTransactions,
  putDocument,
  updateTransactionStatus,
} from "./local-db"
import { resolveConflict, applyServerState } from "./conflict-resolver"
import {
  type TabCoordinator,
  createTabCoordinator,
} from "./multi-tab-coordinator"
import type { Operation } from "./types"

export type SyncEngineConfig = {
  writingId: number
  baseVersion: number
  transport: SyncTransport
}

export type DocumentUpdate = {
  title: string
  content: WritingContent
  version: number
  source: "local" | "remote" | "conflict-resolution"
}

export type SyncEngine = {
  /** 로컬 변경을 기록하고 동기화를 트리거한다 */
  pushLocalChange: (
    operations: Operation[],
    title: string,
    content: WritingContent
  ) => Promise<void>
  /** 서버에서 최신 상태를 가져온다 */
  pull: () => Promise<void>
  /** 현재 동기화 상태를 반환한다 */
  getState: () => string
  /** 문서 업데이트 콜백 등록 */
  onDocumentUpdate: (handler: (update: DocumentUpdate) => void) => void
  /** 상태 변경 콜백 등록 */
  onStateChange: (handler: (state: string) => void) => void
  /** 정리 */
  destroy: () => void
}

export function createSyncEngine(config: SyncEngineConfig): SyncEngine {
  const { writingId, transport } = config

  const documentUpdateHandlers: ((update: DocumentUpdate) => void)[] = []
  const stateChangeHandlers: ((state: string) => void)[] = []
  let tabCoordinator: TabCoordinator | null = null
  let networkCleanup: (() => void) | null = null

  function extractSyncCoreState(value: unknown): string {
    if (typeof value === "object" && value !== null && "syncCore" in value) {
      return String((value as { syncCore: unknown }).syncCore)
    }
    return "idle"
  }

  // XState actor — 액션 구현을 주입
  const providedMachine = syncMachine.provide({
    actions: {
      onFlushPending: () => {
        void flushPending()
      },
      onHandleConflict: ({ context }) => {
        if (context.conflictData) {
          void handleConflict(context.conflictData)
        }
      },
      onTriggerPull: () => {
        void pullFromServer()
      },
    },
  })

  const actor = createActor(providedMachine, {
    input: {
      writingId,
      baseVersion: config.baseVersion,
    },
  })

  // 상태 변경 구독 (관찰 전용)
  actor.subscribe((snapshot) => {
    const syncCoreState = extractSyncCoreState(snapshot.value)
    for (const handler of stateChangeHandlers) {
      handler(syncCoreState)
    }
  })

  actor.start()

  // --- 네트워크 모니터 ---
  if (typeof window !== "undefined") {
    const handleOnline = () => actor.send({ type: "NETWORK_ONLINE" })
    const handleOffline = () => actor.send({ type: "NETWORK_OFFLINE" })
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    if (!navigator.onLine) {
      actor.send({ type: "NETWORK_OFFLINE" })
    }

    networkCleanup = () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }

  // --- 멀티 탭 ---
  if (typeof window !== "undefined") {
    tabCoordinator = createTabCoordinator()

    tabCoordinator.onMessage((msg) => {
      if (msg.type === "SYNC_COMPLETE" && msg.writingId === writingId) {
        // 다른 탭이 동기화를 완료했으면 로컬 DB에서 최신 상태를 읽어 에디터 갱신
        refreshFromLocalDb()
      }

      if (
        msg.type === "LOCAL_CHANGE" &&
        msg.writingId === writingId &&
        msg.tabId !== tabCoordinator?.tabId
      ) {
        // 다른 탭의 로컬 변경이 있으면 리더인 경우 flush 트리거
        if (tabCoordinator?.isLeader()) {
          actor.send({ type: "CHANGE_DETECTED" })
        }
      }
    })
  }

  // --- Core functions ---

  async function flushPending() {
    try {
      // 리더가 아니면 flush하지 않음
      if (tabCoordinator && !tabCoordinator.isLeader()) {
        actor.send({
          type: "SYNC_SUCCESS",
          serverVersion: actor.getSnapshot().context.baseVersion,
        })
        return
      }

      const pending = await getPendingTransactions(writingId)
      const toSend = pending.filter(
        (tx) => tx.status === "pending" || tx.status === "failed"
      )

      if (toSend.length === 0) {
        actor.send({
          type: "SYNC_SUCCESS",
          serverVersion: actor.getSnapshot().context.baseVersion,
        })
        return
      }

      const ids = toSend.map((tx) => tx.id!).filter(Boolean)
      await updateTransactionStatus(ids, "sending")

      const ctx = actor.getSnapshot().context
      const result = await transport.push(writingId, {
        baseVersion: ctx.baseVersion,
        transactions: toSend.map((tx) => ({
          operations: tx.operations,
          createdAt: tx.createdAt,
        })),
      })

      if (result.accepted) {
        await deletePendingTransactions(ids)

        const doc = await getDocument(writingId)
        if (doc) {
          await putDocument({
            ...doc,
            baseVersion: result.serverVersion,
            syncStatus: "synced",
          })
        }

        actor.send({
          type: "SYNC_SUCCESS",
          serverVersion: result.serverVersion,
        })

        // 멀티 탭에 동기화 완료 알림
        tabCoordinator?.broadcast({
          type: "SYNC_COMPLETE",
          writingId,
          version: result.serverVersion,
          tabId: tabCoordinator.tabId,
        })
      } else {
        // 충돌
        await updateTransactionStatus(ids, "failed")
        actor.send({
          type: "SYNC_CONFLICT",
          serverVersion: result.serverVersion,
          serverContent: result.serverContent,
          serverTitle: result.serverTitle,
        })
      }
    } catch (error) {
      const message =
        error instanceof SyncTransportError
          ? `서버 오류 (${error.status})`
          : error instanceof Error
            ? error.message
            : "알 수 없는 오류"
      actor.send({ type: "SYNC_ERROR", error: message })
    }
  }

  async function handleConflict(conflictData: {
    serverVersion: number
    serverContent: WritingContent
    serverTitle: string
  }) {
    const resolved = await resolveConflict(writingId, conflictData)

    for (const handler of documentUpdateHandlers) {
      handler({
        title: resolved.title,
        content: resolved.content,
        version: resolved.baseVersion,
        source: "conflict-resolution",
      })
    }

    actor.send({
      type: "CONFLICT_RESOLVED",
      baseVersion: conflictData.serverVersion,
    })
  }

  async function refreshFromLocalDb() {
    const doc = await getDocument(writingId)
    if (doc) {
      for (const handler of documentUpdateHandlers) {
        handler({
          title: doc.title,
          content: doc.content,
          version: doc.baseVersion,
          source: "remote",
        })
      }
    }
  }

  async function pullFromServer() {
    try {
      const ctx = actor.getSnapshot().context
      const result = await transport.pull(writingId, ctx.baseVersion)

      if (result.hasNewerVersion) {
        const pending = await getPendingTransactions(writingId)
        const hasPending = pending.some((tx) => tx.status === "pending")

        if (hasPending) {
          actor.send({
            type: "SYNC_CONFLICT",
            serverVersion: result.version,
            serverContent: result.content,
            serverTitle: result.title,
          })
        } else {
          await applyServerState(
            writingId,
            result.version,
            result.title,
            result.content
          )

          for (const handler of documentUpdateHandlers) {
            handler({
              title: result.title,
              content: result.content,
              version: result.version,
              source: "remote",
            })
          }

          actor.send({
            type: "SYNC_SUCCESS",
            serverVersion: result.version,
          })
        }
      }
    } catch {
      // pull 실패는 무시 (주기적으로 재시도됨)
    }
  }

  // --- Public API ---

  return {
    async pushLocalChange(operations, title, content) {
      const now = new Date().toISOString()

      // 1. 로컬 DB에 문서 스냅샷 즉시 저장
      const existing = await getDocument(writingId)
      const localVersion = (existing?.localVersion ?? 0) + 1

      await putDocument({
        writingId,
        title,
        content,
        baseVersion: existing?.baseVersion ?? config.baseVersion,
        localVersion,
        lastModifiedAt: now,
        syncStatus: "pending",
      })

      // 2. Pending transaction 큐에 추가
      await enqueuePendingTransaction({
        writingId,
        baseVersion: existing?.baseVersion ?? config.baseVersion,
        operations,
        createdAt: now,
        status: "pending",
      })

      // 3. 상태 머신에 변경 알림
      actor.send({ type: "CHANGE_DETECTED" })

      // 4. 다른 탭에 알림
      tabCoordinator?.broadcast({
        type: "LOCAL_CHANGE",
        writingId,
        tabId: tabCoordinator.tabId,
      })
    },

    async pull() {
      await pullFromServer()
    },

    getState(): string {
      return extractSyncCoreState(actor.getSnapshot().value)
    },

    onDocumentUpdate(handler) {
      documentUpdateHandlers.push(handler)
    },

    onStateChange(handler) {
      stateChangeHandlers.push(handler)
    },

    destroy() {
      actor.stop()
      tabCoordinator?.destroy()
      networkCleanup?.()
      documentUpdateHandlers.length = 0
      stateChangeHandlers.length = 0
    },
  }
}
