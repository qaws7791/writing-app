import type { ResourceNodeId } from "@workspace/types/ids"
import { err, ok, type Result } from "@workspace/kernel/result"

import type {
  ResourceAssetAuditObserver,
  ResourceObjectStoragePort,
  ResourceReconciliationPersistenceError,
  ResourceTreeRepository,
} from "#resource-library/application/ports/resource-library-ports"
import type { PendingResourceAssetDeletion } from "#resource-library/domain/resource-asset"

export type ResourceReconciliationDryRun = Readonly<{
  pending: readonly PendingResourceAssetDeletion[]
}>

export type ResourceReconciliationResult = Readonly<{
  failedRootIds: readonly ResourceNodeId[]
  reconciledRootIds: readonly ResourceNodeId[]
}>

export type ResourceReconciliationDryRunQuery = Readonly<{
  execute: (
    limit: number
  ) => Promise<
    Result<ResourceReconciliationDryRun, ResourceReconciliationPersistenceError>
  >
}>

export type ResourceReconciliationCommand = Readonly<{
  execute: (
    limit: number
  ) => Promise<
    Result<ResourceReconciliationResult, ResourceReconciliationPersistenceError>
  >
}>

export type ResourceReconciliation = Readonly<{
  dryRun: ResourceReconciliationDryRunQuery
  mutation: ResourceReconciliationCommand
}>

export function createResourceReconciliation(input: {
  readonly assetAuditObserver: ResourceAssetAuditObserver
  readonly storage: ResourceObjectStoragePort | null
  readonly treeRepository: ResourceTreeRepository
}): ResourceReconciliation {
  return Object.freeze({
    dryRun: Object.freeze({
      async execute(limit: number) {
        const pending = await readPendingAssetDeletions(input, limit)
        if (pending.isErr()) return err(pending.error)
        return ok({ pending: pending.value })
      },
    }),
    mutation: Object.freeze({
      async execute(limit: number) {
        const pending = await readPendingAssetDeletions(input, limit)
        if (pending.isErr()) return err(pending.error)
        const byRoot = new Map<ResourceNodeId, string[]>()
        for (const asset of pending.value) {
          const objectKeys = byRoot.get(asset.deleteRootId) ?? []
          objectKeys.push(asset.objectKey)
          byRoot.set(asset.deleteRootId, objectKeys)
        }

        const failedRootIds: ResourceNodeId[] = []
        const reconciledRootIds: ResourceNodeId[] = []
        for (const [rootId, objectKeys] of byRoot) {
          let deletion:
            | Readonly<{ kind: "storage-unavailable" }>
            | Readonly<{ kind: "thrown" }>
            | Readonly<{
                kind: "result"
                value: Awaited<
                  ReturnType<ResourceObjectStoragePort["deleteObjects"]>
                >
              }>
          if (input.storage === null) {
            deletion = { kind: "storage-unavailable" }
          } else {
            try {
              deletion = {
                kind: "result",
                value: await input.storage.deleteObjects(objectKeys),
              }
            } catch {
              deletion = { kind: "thrown" }
            }
          }
          if (deletion.kind !== "result" || deletion.value.isErr()) {
            failedRootIds.push(rootId)
            observeDeleteFailure(
              input.assetAuditObserver,
              rootId,
              objectKeys,
              deletion.kind === "thrown" ||
                (deletion.kind === "result" &&
                  deletion.value.isErr() &&
                  deletion.value.error.retryable)
            )
            continue
          }

          try {
            const completed =
              await input.treeRepository.completePermanentDelete(rootId)
            if (completed.kind === "ok") reconciledRootIds.push(rootId)
            else {
              failedRootIds.push(rootId)
              observeReconciliationFailure(
                input.assetAuditObserver,
                rootId,
                objectKeys
              )
            }
          } catch {
            failedRootIds.push(rootId)
            observeReconciliationFailure(
              input.assetAuditObserver,
              rootId,
              objectKeys
            )
          }
        }

        return ok({
          failedRootIds: Object.freeze(failedRootIds),
          reconciledRootIds: Object.freeze(reconciledRootIds),
        })
      },
    }),
  })
}

async function readPendingAssetDeletions(
  input: Readonly<{
    assetAuditObserver: ResourceAssetAuditObserver
    treeRepository: ResourceTreeRepository
  }>,
  limit: number
): Promise<
  Awaited<ReturnType<ResourceTreeRepository["readPendingAssetDeletions"]>>
> {
  let pending: Awaited<
    ReturnType<ResourceTreeRepository["readPendingAssetDeletions"]>
  >
  try {
    pending = await input.treeRepository.readPendingAssetDeletions(limit)
  } catch {
    pending = err({
      kind: "resource-reconciliation-persistence-failed",
      operation: "read-pending-asset-deletions",
    })
  }
  if (pending.isErr()) observePendingReadFailure(input.assetAuditObserver)
  return pending
}

function observePendingReadFailure(observer: ResourceAssetAuditObserver): void {
  try {
    observer({
      kind: "resource-asset-reconciliation-failed",
      phase: "read-pending",
    })
  } catch {
    return
  }
}

function observeReconciliationFailure(
  observer: ResourceAssetAuditObserver,
  rootId: ResourceNodeId,
  objectKeys: readonly string[]
): void {
  try {
    observer({
      kind: "resource-asset-reconciliation-failed",
      objectKeys,
      phase: "complete-metadata",
      rootId,
    })
  } catch {
    return
  }
}

function observeDeleteFailure(
  observer: ResourceAssetAuditObserver,
  rootId: ResourceNodeId,
  objectKeys: readonly string[],
  retryable: boolean
): void {
  try {
    observer({
      kind: "resource-asset-delete-failed",
      objectKeys,
      phase: "reconciliation",
      retryable,
      rootId,
    })
  } catch {
    // 관찰 callback 장애는 삭제 대기 상태를 변경하지 않는다.
  }
}
