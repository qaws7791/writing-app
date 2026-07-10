import type {
  ResourceTreeCommandResult,
  ResourceTreeMutation,
} from "@workspace/core/modules/resource-library/application/ports/resource-tree.repository"
import type {
  ResourceAuditEventId,
  ResourceBreadcrumbItem,
  ResourceDocumentId,
  ResourceFolderId,
  ResourceNodeStatus,
  ResourceTreeNode,
} from "@workspace/core/modules/resource-library/domain/resource-tree-node"

export type ResourceDocumentActor = {
  readonly email: string
  readonly id: string
  readonly name: string
}

export type ResourceDocumentRecord = {
  readonly contentMarkdown: string
  readonly contentRevision: number
  readonly createdAt: Date
  readonly createdBy: ResourceDocumentActor
  readonly id: ResourceDocumentId
  readonly name: string
  readonly parentId: ResourceFolderId | null
  readonly path: readonly ResourceBreadcrumbItem[]
  readonly status: ResourceNodeStatus
  readonly updatedAt: Date
  readonly updatedBy: ResourceDocumentActor
}

export type ImportResourceDocumentInput = {
  readonly actorId: string
  readonly auditEventId: ResourceAuditEventId
  readonly bodyText: string
  readonly documentId: ResourceDocumentId
  readonly expectedRevision: number
  readonly markdown: string
  readonly name: string
  readonly now: Date
  readonly parentId: ResourceFolderId | null
}

export type ImportResourceDocumentResult = ResourceTreeCommandResult<{
  readonly document: ResourceDocumentRecord
  readonly mutation: ResourceTreeMutation & {
    readonly node: ResourceTreeNode
  }
}>

export type SaveResourceDocumentInput = {
  readonly actorId: string
  readonly bodyText: string
  readonly documentId: ResourceDocumentId
  readonly expectedContentRevision: number
  readonly markdown: string
  readonly now: Date
}

export type SaveResourceDocumentResult =
  | { readonly kind: "not-found" }
  | {
      readonly actualContentRevision: number
      readonly kind: "stale-content-revision"
    }
  | { readonly kind: "ok"; readonly value: ResourceDocumentRecord }

export type ResourceDocumentRepository = {
  readonly importDocument: (
    input: ImportResourceDocumentInput
  ) => Promise<ImportResourceDocumentResult>
  readonly readDocument: (
    documentId: ResourceDocumentId
  ) => Promise<ResourceDocumentRecord | null>
  readonly saveDocument: (
    input: SaveResourceDocumentInput
  ) => Promise<SaveResourceDocumentResult>
}
