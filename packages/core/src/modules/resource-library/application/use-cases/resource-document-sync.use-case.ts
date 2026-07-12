import type {
  CommitResourceDocumentTransactionResult,
  ResourceDocumentSyncRepository,
} from "#core/modules/resource-library/application/ports/resource-document-sync.repository"
import {
  adminResourceDocumentMaxNodes,
  adminResourceDocumentProjectionTimeoutMilliseconds,
  adminResourceYjsSnapshotMaxBytes,
  adminResourceYjsUpdateMaxBytes,
} from "@workspace/contracts/admin"
import type { ResourceDocumentTransactionId } from "#core/modules/resource-library/domain/resource-document-sync"
import type { ResourceDocumentId } from "#core/modules/resource-library/domain/resource-tree-node"
import {
  createResourceDocumentSnapshot,
  readResourceMarkdownPlainText,
  type ApplyResourceDocumentUpdateResult,
  type ResourceDocumentIssue,
} from "@workspace/resource-document"

export type SaveResourceDocumentTransactionResult =
  | CommitResourceDocumentTransactionResult
  | {
      readonly issues: readonly ResourceDocumentIssue[]
      readonly kind: "invalid-state"
    }
  | { readonly kind: "update-too-large" }
  | {
      readonly actual: number
      readonly kind: "quota-exceeded"
      readonly limit: number
      readonly quota: "node-count" | "snapshot-bytes" | "transaction-count"
    }
  | {
      readonly elapsedMilliseconds: number
      readonly kind: "projection-timeout"
      readonly limitMilliseconds: number
    }

export type ResourceDocumentSyncRejection = Extract<
  SaveResourceDocumentTransactionResult,
  { readonly kind: "projection-timeout" | "quota-exceeded" }
> & { readonly documentId: ResourceDocumentId }

export type ResourceDocumentSyncPolicy = {
  readonly maxNodeCount?: number
  readonly maxSnapshotBytes?: number
  readonly onRejected?: (event: ResourceDocumentSyncRejection) => void
  readonly projectUpdate?: (input: {
    readonly signal: AbortSignal
    readonly snapshot: Uint8Array
    readonly update: Uint8Array
  }) => Promise<ApplyResourceDocumentUpdateResult>
  readonly projectionTimeoutMilliseconds?: number
}

export type ResourceDocumentSyncUseCase = {
  readonly readSync: (input: {
    readonly afterStateVersion: number
    readonly documentId: ResourceDocumentId
    readonly mode?: "incremental" | "snapshot"
  }) => Promise<
    | { readonly kind: "inactive" }
    | { readonly kind: "not-found" }
    | { readonly kind: "up-to-date"; readonly stateVersion: number }
    | {
        readonly fromStateVersion: number
        readonly kind: "updates"
        readonly stateVersion: number
        readonly updates: readonly Uint8Array[]
      }
    | {
        readonly kind: "snapshot"
        readonly snapshot: Uint8Array
        readonly stateVersion: number
      }
  >
  readonly saveTransaction: (input: {
    readonly actorId: string
    readonly documentId: ResourceDocumentId
    readonly knownStateVersion: number
    readonly now: Date
    readonly transactionId: ResourceDocumentTransactionId
    readonly update: Uint8Array
  }) => Promise<SaveResourceDocumentTransactionResult>
}

export function createResourceDocumentSyncUseCase(
  repository: ResourceDocumentSyncRepository,
  policy: ResourceDocumentSyncPolicy = {}
): ResourceDocumentSyncUseCase {
  const operations = new Map<string, Promise<void>>()
  const maxNodeCount = policy.maxNodeCount ?? adminResourceDocumentMaxNodes
  const maxSnapshotBytes =
    policy.maxSnapshotBytes ?? adminResourceYjsSnapshotMaxBytes
  const projectionTimeoutMilliseconds =
    policy.projectionTimeoutMilliseconds ??
    adminResourceDocumentProjectionTimeoutMilliseconds

  return {
    readSync(input) {
      return enqueueDocumentOperation(
        operations,
        input.documentId,
        async () => {
          const loaded = await repository.loadDocument(input.documentId)
          if (loaded.kind !== "ok") return loaded

          if (
            input.mode !== "snapshot" &&
            input.afterStateVersion === loaded.value.stateVersion
          ) {
            return {
              kind: "up-to-date",
              stateVersion: loaded.value.stateVersion,
            }
          }

          const updates = await repository.readUpdates(input)
          const isContinuous =
            updates.length > 0 &&
            updates[0]?.stateVersion === input.afterStateVersion + 1 &&
            updates.at(-1)?.stateVersion === loaded.value.stateVersion
          const totalBytes = updates.reduce(
            (total, update) => total + update.update.byteLength,
            0
          )

          if (
            input.mode !== "snapshot" &&
            isContinuous &&
            totalBytes <= 1024 * 1024
          ) {
            return {
              fromStateVersion: input.afterStateVersion,
              kind: "updates",
              stateVersion: loaded.value.stateVersion,
              updates: updates.map(({ update }) => update),
            }
          }

          const snapshot =
            loaded.value.snapshot ??
            createResourceDocumentSnapshot(loaded.value.contentMarkdown)
          if (snapshot instanceof Uint8Array) {
            return {
              kind: "snapshot",
              snapshot,
              stateVersion: loaded.value.stateVersion,
            }
          }
          if (snapshot.status === "invalid") {
            throw new Error("저장된 자료 문서 snapshot을 만들 수 없습니다.")
          }

          return {
            kind: "snapshot",
            snapshot: snapshot.snapshot,
            stateVersion: loaded.value.stateVersion,
          }
        }
      )
    },
    saveTransaction(input) {
      return enqueueDocumentOperation(
        operations,
        input.documentId,
        async () => {
          if (input.update.byteLength > adminResourceYjsUpdateMaxBytes) {
            return { kind: "update-too-large" }
          }

          const accepted = await repository.findAcceptedTransaction(input)
          if (accepted !== undefined) return accepted

          const loaded = await repository.loadDocument(input.documentId)
          if (loaded.kind !== "ok") return loaded

          const currentSnapshot =
            loaded.value.snapshot ??
            createResourceDocumentSnapshot(loaded.value.contentMarkdown)

          if (
            "status" in currentSnapshot &&
            currentSnapshot.status === "invalid"
          ) {
            return { issues: currentSnapshot.issues, kind: "invalid-state" }
          }

          const snapshot =
            currentSnapshot instanceof Uint8Array
              ? currentSnapshot
              : currentSnapshot.snapshot
          const projection = await projectUpdateWithDeadline({
            projectUpdate: policy.projectUpdate ?? projectUpdateInWorker,
            snapshot,
            timeoutMilliseconds: projectionTimeoutMilliseconds,
            update: input.update,
          })
          if (projection.kind === "timeout") {
            return rejectTransaction(policy, input.documentId, {
              elapsedMilliseconds: projection.elapsedMilliseconds,
              kind: "projection-timeout",
              limitMilliseconds: projectionTimeoutMilliseconds,
            })
          }

          const applied = projection.result
          if (applied.status === "invalid") {
            return { issues: applied.issues, kind: "invalid-state" }
          }

          if (applied.snapshot.byteLength > maxSnapshotBytes) {
            return rejectTransaction(policy, input.documentId, {
              actual: applied.snapshot.byteLength,
              kind: "quota-exceeded",
              limit: maxSnapshotBytes,
              quota: "snapshot-bytes",
            })
          }
          if (applied.nodeCount > maxNodeCount) {
            return rejectTransaction(policy, input.documentId, {
              actual: applied.nodeCount,
              kind: "quota-exceeded",
              limit: maxNodeCount,
              quota: "node-count",
            })
          }

          const plainText = readResourceMarkdownPlainText(applied.markdown)
          if (plainText.status === "invalid") {
            return { issues: plainText.issues, kind: "invalid-state" }
          }

          const committed = await repository.commitTransaction({
            actorId: input.actorId,
            bodyText: plainText.text,
            documentId: input.documentId,
            expectedStateVersion: loaded.value.stateVersion,
            markdown: applied.markdown,
            now: input.now,
            nodeCount: applied.nodeCount,
            snapshot: applied.snapshot,
            transactionId: input.transactionId,
            update: input.update,
          })

          return committed.kind === "quota-exceeded"
            ? rejectTransaction(policy, input.documentId, committed)
            : committed
        }
      )
    },
  }
}

async function projectUpdateWithDeadline(input: {
  readonly projectUpdate: NonNullable<
    ResourceDocumentSyncPolicy["projectUpdate"]
  >
  readonly snapshot: Uint8Array
  readonly timeoutMilliseconds: number
  readonly update: Uint8Array
}): Promise<
  | { readonly elapsedMilliseconds: number; readonly kind: "timeout" }
  | {
      readonly kind: "completed"
      readonly result: ApplyResourceDocumentUpdateResult
    }
> {
  const controller = new AbortController()
  const startedAt = performance.now()

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      controller.abort()
      resolve({
        elapsedMilliseconds: performance.now() - startedAt,
        kind: "timeout",
      })
    }, input.timeoutMilliseconds)

    void input
      .projectUpdate({
        signal: controller.signal,
        snapshot: input.snapshot,
        update: input.update,
      })
      .then((result) => {
        clearTimeout(timeout)
        resolve({ kind: "completed", result })
      })
      .catch((error: unknown) => {
        clearTimeout(timeout)
        reject(error)
      })
  })
}

function projectUpdateInWorker(input: {
  readonly signal: AbortSignal
  readonly snapshot: Uint8Array
  readonly update: Uint8Array
}): Promise<ApplyResourceDocumentUpdateResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./resource-document-projection.worker.ts", import.meta.url).href
    )
    const abort = () => worker.terminate()

    input.signal.addEventListener("abort", abort, { once: true })
    worker.onmessage = (
      event: MessageEvent<ApplyResourceDocumentUpdateResult>
    ) => {
      input.signal.removeEventListener("abort", abort)
      worker.terminate()
      resolve(event.data)
    }
    worker.onerror = (event) => {
      input.signal.removeEventListener("abort", abort)
      worker.terminate()
      reject(event.error ?? new Error(event.message))
    }
    worker.postMessage({ snapshot: input.snapshot, update: input.update })
  })
}

function rejectTransaction<
  TResult extends Extract<
    SaveResourceDocumentTransactionResult,
    { readonly kind: "projection-timeout" | "quota-exceeded" }
  >,
>(
  policy: ResourceDocumentSyncPolicy,
  documentId: ResourceDocumentId,
  result: TResult
): TResult {
  policy.onRejected?.({ ...result, documentId })
  return result
}

function enqueueDocumentOperation<TResult>(
  operations: Map<string, Promise<void>>,
  documentId: string,
  operation: () => Promise<TResult>
): Promise<TResult> {
  const previous = operations.get(documentId) ?? Promise.resolve()
  const result = previous.then(operation)
  const tail = result.then(
    () => undefined,
    () => undefined
  )

  operations.set(documentId, tail)
  void tail.finally(() => {
    if (operations.get(documentId) === tail) operations.delete(documentId)
  })
  return result
}
