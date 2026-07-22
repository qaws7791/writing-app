import type { AdminApiResult } from "@/shared/http/admin-api-result"

export const resourceLibraryChangedEvent = "resource-library:changed"

export type AdminResourceBreadcrumbItem = {
  readonly id: string
  readonly name: string
}

type AdminResourceTreeNodeBase = {
  readonly id: string
  readonly name: string
  readonly parentId: string | null
  readonly status: "active" | "trashed"
}

export type AdminResourceTreeNode =
  | (AdminResourceTreeNodeBase & {
      readonly hasChildren: false
      readonly kind: "document"
    })
  | (AdminResourceTreeNodeBase & {
      readonly hasChildren: boolean
      readonly kind: "folder"
    })

export type AdminResourceTree = {
  readonly nodes: readonly AdminResourceTreeNode[]
}

export type AdminResourceDocument = {
  readonly contentMarkdown: string
  readonly createdAt: string
  readonly createdBy: {
    readonly email: string
    readonly id: string
    readonly name: string
  }
  readonly id: string
  readonly name: string
  readonly parentId: string | null
  readonly path: readonly AdminResourceBreadcrumbItem[]
  readonly status: "active" | "trashed"
  readonly updatedAt: string
  readonly updatedBy: {
    readonly email: string
    readonly id: string
    readonly name: string
  }
  readonly version: number
}

export type AdminResourceImage = {
  readonly altText: string
  readonly byteSize: number
  readonly contentType: "image/jpeg" | "image/png" | "image/webp"
  readonly id: string
  readonly url: string
}

type AdminResourceNodeMutation = { readonly node: AdminResourceTreeNode }
type AdminResourceTrashResult = {
  readonly documentCount: number
  readonly folderCount: number
}
type AdminResourceRestoreResult = AdminResourceTrashResult & {
  readonly node: AdminResourceTreeNode
}
export type AdminResourceSearch = {
  readonly items: readonly {
    readonly excerpt: string | null
    readonly id: string
    readonly name: string
    readonly path: readonly AdminResourceBreadcrumbItem[]
    readonly version: number
  }[]
}
type AdminImportResourceDocumentInput = {
  readonly fileName: string
  readonly markdown: string
  readonly parentId: string | null
}
type AdminImportResourceDocumentResult = {
  readonly document: AdminResourceDocument
  readonly mutation: AdminResourceNodeMutation
}
type AdminMoveResourceNodeInput = {
  readonly destinationParentId: string | null
}
type AdminRenameResourceFolderInput = { readonly name: string }
export type AdminSaveResourceDocumentInput = {
  readonly contentMarkdown: string
  readonly name: string
}

type ResourceSaveResult =
  | { readonly status: "conflict"; readonly latest: AdminResourceDocument }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ok"; readonly value: AdminResourceDocument }

type ResourceUploadResult =
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ok"; readonly value: AdminResourceImage }

export type ResourceLibraryApi = {
  readonly createResourceDocument: (
    parentId: string | null
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly createResourceFolder: (
    parentId: string | null
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly deleteResourceNode: (
    nodeId: string
  ) => Promise<AdminApiResult<AdminResourceTrashResult>>
  readonly getResourceTree: (
    scope: "active" | "trash"
  ) => Promise<AdminApiResult<AdminResourceTree>>
  readonly importResourceDocument: (
    input: AdminImportResourceDocumentInput
  ) => Promise<AdminApiResult<AdminImportResourceDocumentResult>>
  readonly moveResourceNode: (
    nodeId: string,
    input: AdminMoveResourceNodeInput
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly renameResourceFolder: (
    folderId: string,
    input: AdminRenameResourceFolderInput
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly restoreResourceNode: (
    nodeId: string
  ) => Promise<AdminApiResult<AdminResourceRestoreResult>>
  readonly searchResources: (
    query: string
  ) => Promise<AdminApiResult<AdminResourceSearch>>
  readonly trashResourceNode: (
    nodeId: string
  ) => Promise<AdminApiResult<AdminResourceTrashResult>>
}

export type ResourceDocumentApi = {
  readonly exportResourceDocument: (
    documentId: string
  ) => Promise<
    AdminApiResult<{ readonly fileName: string; readonly markdown: string }>
  >
  readonly getResourceDocument: (
    documentId: string
  ) => Promise<AdminApiResult<AdminResourceDocument>>
  readonly saveResourceDocument: (
    documentId: string,
    version: number,
    input: AdminSaveResourceDocumentInput
  ) => Promise<ResourceSaveResult>
  readonly uploadResourceImage: (
    documentId: string,
    file: File,
    altText: string
  ) => Promise<ResourceUploadResult>
}
