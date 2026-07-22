import type { ResourceTreeCommandRejection } from "#core/modules/resource-library/application/resource-library-error"
import type { AdminId } from "@workspace/types/ids"
import type {
  ResourceBreadcrumbItem,
  ResourceDocumentId,
  ResourceFolderId,
  ResourceNodeStatus,
  ResourceTreeNode,
} from "#core/modules/resource-library/domain/resource-tree-node"

export type ResourceDocumentActor = {
  readonly email: string
  readonly id: AdminId
  readonly name: string
}

export type ResourceDocumentRecord = {
  readonly contentMarkdown: string
  readonly createdAt: Date
  readonly createdBy: ResourceDocumentActor
  readonly id: ResourceDocumentId
  readonly name: string
  readonly parentId: ResourceFolderId | null
  readonly path: readonly ResourceBreadcrumbItem[]
  readonly status: ResourceNodeStatus
  readonly updatedAt: Date
  readonly updatedBy: ResourceDocumentActor
  readonly version: number
}

export type ImportResourceDocumentInput = {
  readonly actorId: string
  readonly bodyText: string
  readonly documentId: ResourceDocumentId
  readonly markdown: string
  readonly name: string
  readonly now: Date
  readonly parentId: ResourceFolderId | null
}

export type ImportResourceDocumentResult =
  | ResourceTreeCommandRejection
  | {
      readonly kind: "ok"
      readonly value: {
        readonly document: ResourceDocumentRecord
        readonly node: ResourceTreeNode
      }
    }

export type SaveResourceDocumentInput = {
  readonly actorId: string
  readonly bodyText: string
  readonly contentMarkdown: string
  readonly documentId: ResourceDocumentId
  readonly expectedVersion: number
  readonly name: string
  readonly now: Date
}

export type SaveResourceDocumentResult =
  | { readonly kind: "not-found" }
  | { readonly kind: "name-conflict" }
  | {
      readonly kind: "invalid-name"
      readonly reason: "empty" | "invalid-character" | "too-long"
    }
  | { readonly kind: "conflict"; readonly document: ResourceDocumentRecord }
  | { readonly kind: "ok"; readonly document: ResourceDocumentRecord }

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
