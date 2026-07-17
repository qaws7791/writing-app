import type {
  ResourceDocumentId,
  ResourceFolderId,
  ResourceNodeId,
  ResourceTreeEntry,
  ResourceTreeNode,
  ResourceTreeScope,
} from "#core/modules/resource-library/domain/resource-tree-node"
import type { ResourceTreeCommandResult } from "#core/modules/resource-library/application/resource-library-error"

type ResourceTreeCommandContext = {
  readonly actorId: string
  readonly now: Date
}

export type CreateResourceNodeInput = ResourceTreeCommandContext &
  (
    | {
        readonly kind: "document"
        readonly nodeId: ResourceDocumentId
      }
    | {
        readonly kind: "folder"
        readonly nodeId: ResourceFolderId
      }
  ) & {
    readonly parentId: ResourceFolderId | null
    readonly preferredName: string
  }

export type RenameResourceFolderInput = ResourceTreeCommandContext & {
  readonly folderId: ResourceFolderId
  readonly name: string
}

export type MoveResourceNodeInput = ResourceTreeCommandContext & {
  readonly destinationParentId: ResourceFolderId | null
  readonly nodeId: ResourceNodeId
}

export type ResourceNodeCommandInput = ResourceTreeCommandContext & {
  readonly nodeId: ResourceNodeId
}

export type ResourceTreeNodeResult = ResourceTreeCommandResult<{
  readonly node: ResourceTreeNode
}>

export type ResourceTrashResult = ResourceTreeCommandResult<{
  readonly documentCount: number
  readonly folderCount: number
}>

export type ResourceRestoreResult = ResourceTreeCommandResult<{
  readonly documentCount: number
  readonly folderCount: number
  readonly node: ResourceTreeNode
}>

export type ResourcePermanentDeleteResult = ResourceTreeCommandResult<{
  readonly documentCount: number
  readonly folderCount: number
  readonly r2ObjectKeys: readonly string[]
}>

export type ResourceTreeRepository = {
  readonly createNode: (
    input: CreateResourceNodeInput
  ) => Promise<ResourceTreeNodeResult>
  readonly deleteNodePermanently: (
    input: ResourceNodeCommandInput
  ) => Promise<ResourcePermanentDeleteResult>
  readonly moveNode: (
    input: MoveResourceNodeInput
  ) => Promise<ResourceTreeNodeResult>
  readonly readSubtree: (
    nodeId: ResourceNodeId
  ) => Promise<readonly ResourceTreeNode[]>
  readonly readTree: (
    scope: ResourceTreeScope
  ) => Promise<readonly ResourceTreeEntry[]>
  readonly renameFolder: (
    input: RenameResourceFolderInput
  ) => Promise<ResourceTreeNodeResult>
  readonly restoreNode: (
    input: ResourceNodeCommandInput
  ) => Promise<ResourceRestoreResult>
  readonly trashNode: (
    input: ResourceNodeCommandInput
  ) => Promise<ResourceTrashResult>
}
