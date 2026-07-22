import type { AdminResourceDocumentDto } from "@workspace/contracts/resource-library/admin-resource-documents"
import type { AdminResourceSearchItemDto } from "@workspace/contracts/resource-library/admin-resource-search"
import type { AdminResourceTreeNodeDto } from "@workspace/contracts/resource-library/admin-resource-tree"

import type { ResourceSearchRecord } from "#resource-library/application/ports/resource-library-ports"
import type { ResourceDocument } from "#resource-library/domain/resource-document"
import type { ResourceTreeNode } from "#resource-library/domain/resource-tree-node"

export function toResourceDocumentDto(
  document: ResourceDocument
): AdminResourceDocumentDto {
  return {
    ...document,
    createdAt: document.createdAt.toISOString(),
    path: [...document.path],
    updatedAt: document.updatedAt.toISOString(),
  }
}

export function toResourceSearchItemDto(
  item: ResourceSearchRecord
): AdminResourceSearchItemDto {
  return { ...item, path: [...item.path] }
}

export function toResourceTreeNodeDto(
  node: ResourceTreeNode,
  hasChildren: boolean
): AdminResourceTreeNodeDto {
  return node.kind === "folder"
    ? {
        hasChildren,
        id: node.id,
        kind: "folder",
        name: node.name,
        parentId: node.parentId,
        status: node.status,
      }
    : {
        hasChildren: false,
        id: node.id,
        kind: "document",
        name: node.name,
        parentId: node.parentId,
        status: node.status,
      }
}
