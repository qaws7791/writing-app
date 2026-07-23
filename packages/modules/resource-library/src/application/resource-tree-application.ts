import type { ResourceFolderId, ResourceNodeId } from "@workspace/types/ids"

import type {
  ResourceCommandResult,
  ResourceLibraryDependencies,
  ResourceObjectStoragePort,
} from "#resource-library/application/ports/resource-library-ports"
import {
  authorizeResourceAccess,
  type ResourceActor,
} from "#resource-library/domain/resource-access-policy"
import { sortResourceTreeEntries } from "#resource-library/domain/resource-tree-policy"
import type {
  ResourceTreeEntry,
  ResourceTreeNode,
  ResourceTreeScope,
} from "#resource-library/domain/resource-tree-node"

type ResourceTreeMutation = Readonly<{ node: ResourceTreeNode }>
type ResourceTrashResult = Readonly<{
  documentCount: number
  folderCount: number
}>
type ResourceRestoreResult = ResourceTrashResult &
  Readonly<{ node: ResourceTreeNode }>

export type ResourceTreeApplication = Readonly<{
  createDocument: (input: {
    readonly actor: ResourceActor
    readonly parentId: ResourceFolderId | null
  }) => Promise<ResourceCommandResult<ResourceTreeMutation>>
  createFolder: (input: {
    readonly actor: ResourceActor
    readonly parentId: ResourceFolderId | null
  }) => Promise<ResourceCommandResult<ResourceTreeMutation>>
  deleteNodePermanently: (input: {
    readonly actor: ResourceActor
    readonly nodeId: ResourceNodeId
  }) => Promise<ResourceCommandResult<ResourceTrashResult>>
  moveNode: (input: {
    readonly actor: ResourceActor
    readonly destinationParentId: ResourceFolderId | null
    readonly nodeId: ResourceNodeId
  }) => Promise<ResourceCommandResult<ResourceTreeMutation>>
  readTree: (scope: ResourceTreeScope) => Promise<readonly ResourceTreeEntry[]>
  renameFolder: (input: {
    readonly actor: ResourceActor
    readonly folderId: ResourceFolderId
    readonly name: string
  }) => Promise<ResourceCommandResult<ResourceTreeMutation>>
  restoreNode: (input: {
    readonly actor: ResourceActor
    readonly nodeId: ResourceNodeId
  }) => Promise<ResourceCommandResult<ResourceRestoreResult>>
  trashNode: (input: {
    readonly actor: ResourceActor
    readonly nodeId: ResourceNodeId
  }) => Promise<ResourceCommandResult<ResourceTrashResult>>
}>

export function createResourceTreeApplication(
  dependencies: Pick<
    ResourceLibraryDependencies,
    | "assetAuditObserver"
    | "clock"
    | "documentIdGenerator"
    | "folderIdGenerator"
    | "storage"
    | "treeRepository"
  >
): ResourceTreeApplication {
  return Object.freeze({
    createDocument(input) {
      if (authorizeResourceAccess(input.actor) === "forbidden") {
        return Promise.resolve({ kind: "resource-forbidden" })
      }
      return dependencies.treeRepository.createNode({
        actorId: input.actor.id,
        kind: "document",
        nodeId: dependencies.documentIdGenerator.next(),
        now: dependencies.clock.now(),
        parentId: input.parentId,
        preferredName: "제목 없음",
      })
    },
    createFolder(input) {
      if (authorizeResourceAccess(input.actor) === "forbidden") {
        return Promise.resolve({ kind: "resource-forbidden" })
      }
      return dependencies.treeRepository.createNode({
        actorId: input.actor.id,
        kind: "folder",
        nodeId: dependencies.folderIdGenerator.next(),
        now: dependencies.clock.now(),
        parentId: input.parentId,
        preferredName: "새 폴더",
      })
    },
    async deleteNodePermanently(input) {
      if (authorizeResourceAccess(input.actor) === "forbidden") {
        return { kind: "resource-forbidden" }
      }

      let prepared: Awaited<
        ReturnType<
          ResourceLibraryDependencies["treeRepository"]["preparePermanentDelete"]
        >
      >
      try {
        prepared = await dependencies.treeRepository.preparePermanentDelete({
          actorId: input.actor.id,
          nodeId: input.nodeId,
          now: dependencies.clock.now(),
        })
      } catch {
        return {
          kind: "resource-persistence-failure",
          operation: "prepare-delete",
        }
      }
      if (prepared.kind !== "ok") return prepared

      const objectKeys = prepared.value.assets.map(({ objectKey }) => objectKey)
      if (objectKeys.length > 0) {
        if (dependencies.storage === null) {
          observeDeleteFailure(
            dependencies,
            prepared.value.rootId,
            objectKeys,
            false
          )
          return {
            compensation: "not-required",
            kind: "resource-storage-failure",
            operation: "delete",
            retryable: false,
          }
        }
        let deleted: Awaited<
          ReturnType<ResourceObjectStoragePort["deleteObjects"]>
        >
        try {
          deleted = await dependencies.storage.deleteObjects(objectKeys)
        } catch {
          observeDeleteFailure(
            dependencies,
            prepared.value.rootId,
            objectKeys,
            true
          )
          return {
            compensation: "not-required",
            kind: "resource-storage-failure",
            operation: "delete",
            retryable: true,
          }
        }
        if (deleted.isErr()) {
          observeDeleteFailure(
            dependencies,
            prepared.value.rootId,
            objectKeys,
            deleted.error.retryable
          )
          return {
            compensation: "not-required",
            kind: "resource-storage-failure",
            operation: "delete",
            retryable: deleted.error.retryable,
          }
        }
      }

      try {
        const completed =
          await dependencies.treeRepository.completePermanentDelete(
            prepared.value.rootId
          )
        return completed.kind === "ok"
          ? {
              kind: "ok",
              value: {
                documentCount: prepared.value.documentCount,
                folderCount: prepared.value.folderCount,
              },
            }
          : completed
      } catch {
        return {
          kind: "resource-persistence-failure",
          operation: "complete-delete",
        }
      }
    },
    moveNode(input) {
      if (authorizeResourceAccess(input.actor) === "forbidden") {
        return Promise.resolve({ kind: "resource-forbidden" })
      }
      return dependencies.treeRepository.moveNode({
        actorId: input.actor.id,
        destinationParentId: input.destinationParentId,
        nodeId: input.nodeId,
        now: dependencies.clock.now(),
      })
    },
    async readTree(scope) {
      return sortResourceTreeEntries(
        await dependencies.treeRepository.readTree(scope)
      )
    },
    renameFolder(input) {
      if (authorizeResourceAccess(input.actor) === "forbidden") {
        return Promise.resolve({ kind: "resource-forbidden" })
      }
      return dependencies.treeRepository.renameFolder({
        actorId: input.actor.id,
        folderId: input.folderId,
        name: input.name,
        now: dependencies.clock.now(),
      })
    },
    restoreNode(input) {
      if (authorizeResourceAccess(input.actor) === "forbidden") {
        return Promise.resolve({ kind: "resource-forbidden" })
      }
      return dependencies.treeRepository.restoreNode({
        actorId: input.actor.id,
        nodeId: input.nodeId,
        now: dependencies.clock.now(),
      })
    },
    trashNode(input) {
      if (authorizeResourceAccess(input.actor) === "forbidden") {
        return Promise.resolve({ kind: "resource-forbidden" })
      }
      return dependencies.treeRepository.trashNode({
        actorId: input.actor.id,
        nodeId: input.nodeId,
        now: dependencies.clock.now(),
      })
    },
  })
}

function observeDeleteFailure(
  dependencies: Pick<ResourceLibraryDependencies, "assetAuditObserver">,
  rootId: ResourceNodeId,
  objectKeys: readonly string[],
  retryable: boolean
): void {
  try {
    dependencies.assetAuditObserver({
      kind: "resource-asset-delete-failed",
      objectKeys,
      phase: "permanent-delete",
      retryable,
      rootId,
    })
  } catch {
    // 관찰 callback 장애가 이미 보존한 삭제 대기 상태를 바꾸지 않는다.
  }
}
