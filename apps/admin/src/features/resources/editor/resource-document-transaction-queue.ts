import { mergeUpdates } from "yjs"

import type {
  AdminResourceDocumentTransactionInput,
  AdminResourceDocumentTransactionResult,
} from "@/lib/api/admin-api"
import type { AdminApiError } from "@/lib/api/api-error"
import type { AdminApiResult } from "@/lib/api/api-result"

type QueuedTransaction = AdminResourceDocumentTransactionInput

export type ResourceDocumentTransactionQueue = {
  readonly advanceKnownStateVersion: (stateVersion: number) => void
  readonly dispose: () => void
  readonly enqueue: (update: Uint8Array) => void
  readonly flush: () => void
  readonly hasPending: () => boolean
  readonly retry: () => Promise<void>
}

export function createResourceDocumentTransactionQueue(input: {
  readonly createTransactionId?: () => string
  readonly documentId: string
  readonly knownStateVersion: number
  readonly onAccepted: (result: {
    readonly contentRevision: number
    readonly stateVersion: number
  }) => void
  readonly onError: (error: AdminApiError) => void
  readonly onPending?: () => void
  readonly save: (
    documentId: string,
    transaction: AdminResourceDocumentTransactionInput
  ) => Promise<AdminApiResult<AdminResourceDocumentTransactionResult>>
}): ResourceDocumentTransactionQueue {
  const createTransactionId =
    input.createTransactionId ?? (() => crypto.randomUUID())
  const transactions: QueuedTransaction[] = []
  const pendingUpdates: Uint8Array[] = []
  let knownStateVersion = input.knownStateVersion
  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let maximumTimer: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  let sending = false

  function clearBatchTimers(): void {
    if (idleTimer !== undefined) clearTimeout(idleTimer)
    if (maximumTimer !== undefined) clearTimeout(maximumTimer)
    idleTimer = undefined
    maximumTimer = undefined
  }

  function flush(): void {
    if (disposed || pendingUpdates.length === 0) return

    clearBatchTimers()
    transactions.push({
      knownStateVersion,
      transactionId: createTransactionId(),
      update: mergeUpdates(pendingUpdates.splice(0)),
    })
    void sendNext()
  }

  async function sendNext(): Promise<void> {
    const transaction = transactions[0]
    if (disposed || sending || transaction === undefined) return

    sending = true
    const result = await input.save(input.documentId, transaction)
    sending = false
    if (disposed) return

    if (result.status === "error") {
      input.onError(result.error)
      return
    }

    transactions.shift()
    knownStateVersion = Math.max(knownStateVersion, result.value.stateVersion)
    input.onAccepted({
      contentRevision: result.value.contentRevision,
      stateVersion: result.value.stateVersion,
    })
    await sendNext()
  }

  return {
    advanceKnownStateVersion(stateVersion) {
      knownStateVersion = Math.max(knownStateVersion, stateVersion)
    },
    dispose() {
      if (disposed) return

      disposed = true
      clearBatchTimers()
      pendingUpdates.length = 0
      transactions.length = 0
    },
    enqueue(update) {
      if (disposed) return

      const wasPending =
        pendingUpdates.length > 0 || transactions.length > 0 || sending
      pendingUpdates.push(update)
      if (!wasPending) input.onPending?.()
      if (idleTimer !== undefined) clearTimeout(idleTimer)
      idleTimer = setTimeout(flush, 500)
      maximumTimer ??= setTimeout(flush, 1_000)
    },
    flush,
    hasPending() {
      return pendingUpdates.length > 0 || transactions.length > 0 || sending
    },
    async retry() {
      await sendNext()
    },
  }
}
