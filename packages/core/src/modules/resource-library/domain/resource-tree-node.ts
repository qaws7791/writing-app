import type {
  ResourceAssetId,
  ResourceDocumentId,
  ResourceFolderId,
  ResourceNodeId,
} from "@workspace/types/ids"

export type {
  ResourceAssetId,
  ResourceDocumentId,
  ResourceFolderId,
  ResourceNodeId,
} from "@workspace/types/ids"
export type ResourceNodeStatus = "active" | "trashed"
export type ResourceTreeScope = "active" | "trash"

type ResourceTreeNodeBase = {
  readonly name: string
  readonly normalizedName: string
  readonly parentId: ResourceFolderId | null
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

export type ResourceTreeEntry = {
  readonly hasChildren: boolean
  readonly node: ResourceTreeNode
}

export type ResourceBreadcrumbItem = {
  readonly id: ResourceFolderId
  readonly name: string
}

export function toResourceFolderId(value: string): ResourceFolderId {
  return value as ResourceFolderId
}

export function toResourceDocumentId(value: string): ResourceDocumentId {
  return value as ResourceDocumentId
}

export function toResourceAssetId(value: string): ResourceAssetId {
  return value as ResourceAssetId
}

export function toResourceNodeId(value: string): ResourceNodeId {
  return value as ResourceNodeId
}

export function parseResourceBreadcrumbPath(
  value: string
): readonly ResourceBreadcrumbItem[] {
  const parsed: unknown = JSON.parse(value)
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        typeof item.id === "string" &&
        "name" in item &&
        typeof item.name === "string"
    )
  ) {
    throw new Error("자료 문서 경로 형식이 올바르지 않습니다.")
  }
  return parsed.map((item) => ({
    id: toResourceFolderId(item.id),
    name: item.name,
  }))
}
