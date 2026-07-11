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

export type ResourceDocumentMetadataRecord = {
  readonly contentRevision: number
  readonly createdAt: Date
  readonly createdBy: ResourceDocumentActor
  readonly id: ResourceDocumentId
  readonly name: string
  readonly parentId: ResourceFolderId | null
  readonly path: readonly ResourceBreadcrumbItem[]
  readonly stateVersion: number
  readonly status: ResourceNodeStatus
  readonly updatedAt: Date
  readonly updatedBy: ResourceDocumentActor
}

export type ResourceDocumentRecord = ResourceDocumentMetadataRecord & {
  readonly contentMarkdown: string
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

export type ResourceDocumentRepository = {
  readonly importDocument: (
    input: ImportResourceDocumentInput
  ) => Promise<ImportResourceDocumentResult>
  readonly readDocumentContent: (
    documentId: ResourceDocumentId
  ) => Promise<string | null>
  readonly readDocumentMetadata: (
    documentId: ResourceDocumentId
  ) => Promise<ResourceDocumentMetadataRecord | null>
}
