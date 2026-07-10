import type {
  ResourceAuditEventId,
  ResourceDocumentId,
  ResourceFolderId,
  ResourceNodeId,
  ResourceTreeNode,
} from "@workspace/core/modules/resource-library/domain/resource-tree-node"

type ResourceTreeCommandContext = {
  readonly actorId: string
  readonly auditEventId: ResourceAuditEventId
  readonly expectedRevision: number
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

export type RenameResourceNodeInput = ResourceTreeCommandContext & {
  readonly name: string
  readonly nodeId: ResourceNodeId
}

export type MoveResourceNodeInput = ResourceTreeCommandContext & {
  readonly destinationIndex: number
  readonly destinationParentId: ResourceFolderId | null
  readonly nodeId: ResourceNodeId
}

export type TrashResourceNodeInput = ResourceTreeCommandContext & {
  readonly nodeId: ResourceNodeId
}

export type RestoreResourceNodeInput = ResourceTreeCommandContext & {
  readonly nodeId: ResourceNodeId
}

export type ResourceTreeCommandRejection =
  | {
      readonly actualRevision: number
      readonly kind: "stale-revision"
    }
  | {
      readonly kind: "not-found"
    }
  | {
      readonly kind: "parent-not-found"
    }
  | {
      readonly kind: "name-conflict"
    }
  | {
      readonly kind: "invalid-name"
      readonly reason: "empty" | "too-long"
    }
  | {
      readonly kind: "cycle"
    }
  | {
      readonly kind: "invalid-position"
    }

export type ResourceTreeMutation = {
  readonly affectedParentIds: readonly (ResourceFolderId | null)[]
  readonly revision: number
}

export type ResourceTreeCommandResult<TValue> =
  | {
      readonly kind: "ok"
      readonly value: TValue
    }
  | ResourceTreeCommandRejection

export type CreateResourceNodeResult = ResourceTreeCommandResult<
  ResourceTreeMutation & {
    readonly node: ResourceTreeNode
  }
>

export type RenameResourceNodeResult = ResourceTreeCommandResult<
  ResourceTreeMutation & {
    readonly node: ResourceTreeNode
  }
>

export type MoveResourceNodeResult = ResourceTreeCommandResult<
  ResourceTreeMutation & {
    readonly node: ResourceTreeNode
  }
>

export type TrashResourceNodeResult = ResourceTreeCommandResult<
  ResourceTreeMutation & {
    readonly documentCount: number
    readonly folderCount: number
  }
>

export type RestoreResourceNodeResult = ResourceTreeCommandResult<
  ResourceTreeMutation & {
    readonly documentCount: number
    readonly folderCount: number
    readonly node: ResourceTreeNode
  }
>

export type ResourceTreeRepository = {
  readonly createNode: (
    input: CreateResourceNodeInput
  ) => Promise<CreateResourceNodeResult>
  readonly moveNode: (
    input: MoveResourceNodeInput
  ) => Promise<MoveResourceNodeResult>
  readonly readChildren: (input: {
    readonly parentId: ResourceFolderId | null
  }) => Promise<readonly ResourceTreeNode[]>
  readonly readRevision: () => Promise<number>
  readonly readSubtree: (
    nodeId: ResourceNodeId
  ) => Promise<readonly ResourceTreeNode[]>
  readonly renameNode: (
    input: RenameResourceNodeInput
  ) => Promise<RenameResourceNodeResult>
  readonly restoreNode: (
    input: RestoreResourceNodeInput
  ) => Promise<RestoreResourceNodeResult>
  readonly trashNode: (
    input: TrashResourceNodeInput
  ) => Promise<TrashResourceNodeResult>
}
