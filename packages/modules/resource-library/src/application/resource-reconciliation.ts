import type { ResourceNodeId } from "@workspace/types/ids"

import type {
  ResourceAssetAuditObserver,
  ResourceObjectStoragePort,
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
  execute: (limit: number) => Promise<ResourceReconciliationDryRun>
}>

export type ResourceReconciliationCommand = Readonly<{
  execute: (limit: number) => Promise<ResourceReconciliationResult>
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
        return {
          pending: await input.treeRepository.readPendingAssetDeletions(limit),
        }
      },
    }),
    mutation: Object.freeze({
      async execute(limit: number) {
        const pending =
          await input.treeRepository.readPendingAssetDeletions(limit)
        const byRoot = new Map<ResourceNodeId, string[]>()
        for (const asset of pending) {
          const objectKeys = byRoot.get(asset.deleteRootId) ?? []
          objectKeys.push(asset.objectKey)
          byRoot.set(asset.deleteRootId, objectKeys)
        }

        const failedRootIds: ResourceNodeId[] = []
        const reconciledRootIds: ResourceNodeId[] = []
        for (const [rootId, objectKeys] of byRoot) {
          const deleted = await input.storage?.deleteObjects(objectKeys)
          if (deleted === undefined || deleted.isErr()) {
            failedRootIds.push(rootId)
            observeFailure(input.assetAuditObserver, rootId, objectKeys)
            continue
          }

          try {
            const completed =
              await input.treeRepository.completePermanentDelete(rootId)
            if (completed.kind === "ok") reconciledRootIds.push(rootId)
            else failedRootIds.push(rootId)
          } catch {
            failedRootIds.push(rootId)
          }
        }

        return {
          failedRootIds: Object.freeze(failedRootIds),
          reconciledRootIds: Object.freeze(reconciledRootIds),
        }
      },
    }),
  })
}

function observeFailure(
  observer: ResourceAssetAuditObserver,
  rootId: ResourceNodeId,
  objectKeys: readonly string[]
): void {
  try {
    observer({
      kind: "resource-asset-delete-failed",
      objectKeys,
      rootId,
    })
  } catch {
    // 관찰 callback 장애는 삭제 대기 상태를 변경하지 않는다.
  }
}
