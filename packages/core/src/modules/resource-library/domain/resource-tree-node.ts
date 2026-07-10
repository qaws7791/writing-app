import type { Brand } from "@workspace/contracts/content/content.ids"

export type ResourceFolderId = Brand<string, "ResourceFolderId">
export type ResourceDocumentId = Brand<string, "ResourceDocumentId">
export type ResourceAuditEventId = Brand<string, "ResourceAuditEventId">
export type ResourceNodeId = ResourceFolderId | ResourceDocumentId
export type ResourceNodeStatus = "active" | "archived"

type ResourceTreeNodeBase = {
  readonly name: string
  readonly normalizedName: string
  readonly parentId: ResourceFolderId | null
  readonly sortOrder: number
  readonly status: ResourceNodeStatus
  readonly trashRootId: ResourceNodeId | null
}

export type ResourceFolderNode = ResourceTreeNodeBase & {
  readonly id: ResourceFolderId
  readonly kind: "folder"
}

export type ResourceDocumentNode = ResourceTreeNodeBase & {
  readonly id: ResourceDocumentId
  readonly kind: "document"
}

export type ResourceTreeNode = ResourceFolderNode | ResourceDocumentNode

export function toResourceFolderId(value: string): ResourceFolderId {
  return value as ResourceFolderId
}

export function toResourceDocumentId(value: string): ResourceDocumentId {
  return value as ResourceDocumentId
}

export function toResourceNodeId(value: string): ResourceNodeId {
  return value as ResourceNodeId
}

export function toResourceAuditEventId(value: string): ResourceAuditEventId {
  return value as ResourceAuditEventId
}
