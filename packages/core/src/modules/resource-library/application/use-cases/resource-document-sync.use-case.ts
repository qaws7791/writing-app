import type {
  CommitResourceDocumentTransactionResult,
  ResourceDocumentSyncRepository,
} from "@workspace/core/modules/resource-library/application/ports/resource-document-sync.repository"
import type { ResourceDocumentTransactionId } from "@workspace/core/modules/resource-library/domain/resource-document-sync"
import type { ResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import {
  applyResourceDocumentUpdate,
  createResourceDocumentSnapshot,
  readResourceMarkdownPlainText,
  type ResourceDocumentIssue,
} from "@workspace/resource-document"

export type SaveResourceDocumentTransactionResult =
  | CommitResourceDocumentTransactionResult
  | {
      readonly issues: readonly ResourceDocumentIssue[]
      readonly kind: "invalid-state"
    }
  | { readonly kind: "update-too-large" }

export type ResourceDocumentSyncUseCase = {
  readonly readSync: (input: {
    readonly afterStateVersion: number
    readonly documentId: ResourceDocumentId
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
  repository: ResourceDocumentSyncRepository
): ResourceDocumentSyncUseCase {
  const operations = new Map<string, Promise<void>>()

  return {
    readSync(input) {
      return enqueueDocumentOperation(
        operations,
        input.documentId,
        async () => {
          const loaded = await repository.loadDocument(input.documentId)
          if (loaded.kind !== "ok") return loaded

          if (input.afterStateVersion === loaded.value.stateVersion) {
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

          if (isContinuous && totalBytes <= 1024 * 1024) {
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
          if (input.update.byteLength > 512 * 1024) {
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
          const applied = applyResourceDocumentUpdate(snapshot, input.update)
          if (applied.status === "invalid") {
            return { issues: applied.issues, kind: "invalid-state" }
          }

          const plainText = readResourceMarkdownPlainText(applied.markdown)
          if (plainText.status === "invalid") {
            return { issues: plainText.issues, kind: "invalid-state" }
          }

          return repository.commitTransaction({
            actorId: input.actorId,
            bodyText: plainText.text,
            documentId: input.documentId,
            expectedStateVersion: loaded.value.stateVersion,
            markdown: applied.markdown,
            now: input.now,
            snapshot: applied.snapshot,
            transactionId: input.transactionId,
            update: input.update,
          })
        }
      )
    },
  }
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
