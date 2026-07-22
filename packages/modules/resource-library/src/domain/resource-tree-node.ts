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

type ResourceTreeNodeBase = Readonly<{
  name: string
  normalizedName: string
  parentId: ResourceFolderId | null
  status: ResourceNodeStatus
  trashRootId: ResourceNodeId | null
}>

type ResourceFolderNode = ResourceTreeNodeBase &
  Readonly<{
    id: ResourceFolderId
    kind: "folder"
  }>

type ResourceDocumentNode = ResourceTreeNodeBase &
  Readonly<{
    id: ResourceDocumentId
    kind: "document"
  }>

export type ResourceTreeNode = ResourceFolderNode | ResourceDocumentNode

export type ResourceTreeEntry = Readonly<{
  hasChildren: boolean
  node: ResourceTreeNode
}>

export type ResourceBreadcrumbItem = Readonly<{
  id: ResourceFolderId
  name: string
}>

export function readResourceFolderId(value: string): ResourceFolderId {
  return value as ResourceFolderId
}

export function readResourceDocumentId(value: string): ResourceDocumentId {
  return value as ResourceDocumentId
}

export function readResourceAssetId(value: string): ResourceAssetId {
  return value as ResourceAssetId
}

export function readResourceNodeId(value: string): ResourceNodeId {
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
    id: readResourceFolderId(item.id),
    name: item.name,
  }))
}
