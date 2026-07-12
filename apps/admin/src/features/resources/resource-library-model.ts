export type AdminResourceTreeScope = "active" | "trash"

export type AdminResourceBreadcrumbItem = {
  readonly id: string
  readonly name: string
}
export type AdminResourceActor = {
  readonly email: string
  readonly id: string
  readonly name: string
}
type AdminResourceTreeNodeBase = {
  readonly id: string
  readonly name: string
  readonly parentId: string | null
  readonly sortOrder: number
  readonly status: "active" | "archived"
}
export type AdminResourceTreeNode =
  | (AdminResourceTreeNodeBase & {
      readonly hasChildren: boolean
      readonly kind: "folder"
    })
  | (AdminResourceTreeNodeBase & {
      readonly hasChildren: false
      readonly kind: "document"
    })
export type AdminResourceTree = {
  readonly nodes: readonly AdminResourceTreeNode[]
  readonly revision: number
}
export type AdminResourceActiveEditorCount = {
  readonly activeEditorCount: number
}
export type AdminResourceTreeMutationAction =
  | "create-document"
  | "create-folder"
  | "import-document"
  | "move"
  | "rename"
  | "restore"
  | "trash"
export type AdminResourceEvent =
  | {
      readonly action: AdminResourceTreeMutationAction
      readonly affectedParentIds: readonly (string | null)[]
      readonly nodeId: string
      readonly revision: number
      readonly type: "resource-tree-mutated"
    }
  | {
      readonly documentId: string
      readonly name: string
      readonly revision: number
      readonly type: "resource-document-title-confirmed"
    }
export type AdminResourceDocumentRealtimeEvent =
  | {
      readonly documentId: string
      readonly stateVersion: number
      readonly type: "resource-document-subscription-confirmed"
    }
  | {
      readonly contentRevision: number
      readonly documentId: string
      readonly stateVersion: number
      readonly type: "resource-document-version-advanced"
    }
  | {
      readonly documentId: string
      readonly reason: "archived" | "projection-failed"
      readonly type: "resource-document-invalidated"
    }
export type AdminResourceRealtimeMessage =
  | AdminResourceDocumentRealtimeEvent
  | AdminResourceEvent
export type AdminResourceNodeMutation = {
  readonly affectedParentIds: readonly (string | null)[]
  readonly node: AdminResourceTreeNode
  readonly revision: number
}
type AdminResourceSubtreeMutation = {
  readonly affectedParentIds: readonly (string | null)[]
  readonly documentCount: number
  readonly folderCount: number
  readonly revision: number
}
export type AdminResourceTrashResult = AdminResourceSubtreeMutation
export type AdminResourceRestoreResult = AdminResourceSubtreeMutation & {
  readonly node: AdminResourceTreeNode
}
type AdminResourceLibraryDocumentMetadata = {
  readonly contentRevision: number
  readonly createdAt: string
  readonly createdBy: AdminResourceActor
  readonly id: string
  readonly name: string
  readonly parentId: string | null
  readonly path: readonly AdminResourceBreadcrumbItem[]
  readonly stateVersion: number
  readonly updatedAt: string
  readonly updatedBy: AdminResourceActor
}
export type AdminResourceActiveDocument =
  AdminResourceLibraryDocumentMetadata & {
    readonly status: "active"
  }
export type AdminResourceArchivedDocument =
  AdminResourceLibraryDocumentMetadata & {
    readonly contentMarkdown: string
    readonly status: "archived"
  }
export type AdminResourceLibraryDocument =
  | AdminResourceActiveDocument
  | AdminResourceArchivedDocument
export type AdminResourceDocumentTransactionInput = {
  readonly knownStateVersion: number
  readonly transactionId: string
  readonly update: Uint8Array
}
export type AdminResourceDocumentTransactionResult = {
  readonly contentRevision: number
  readonly kind: "accepted" | "already-accepted"
  readonly stateVersion: number
  readonly transactionId: string
}
export type AdminResourceDocumentSync =
  | { readonly kind: "up-to-date"; readonly stateVersion: number }
  | {
      readonly fromStateVersion: number
      readonly kind: "updates"
      readonly stateVersion: number
      readonly updates: readonly Uint8Array[]
    }
  | {
      readonly kind: "snapshot"
      readonly snapshot: Uint8Array
      readonly stateVersion: number
    }
export type AdminImportResourceDocumentInput = {
  readonly expectedRevision: number
  readonly fileName: string
  readonly markdown: string
  readonly parentId: string | null
}
export type AdminImportResourceDocumentResult = {
  readonly document: AdminResourceActiveDocument
  readonly mutation: AdminResourceNodeMutation
}
export type AdminExportResourceDocument = {
  readonly fileName: string
  readonly markdown: string
}
export type AdminResourceSearchItem = {
  readonly excerpt: string | null
  readonly id: string
  readonly kind: "document" | "folder"
  readonly name: string
  readonly path: readonly AdminResourceBreadcrumbItem[]
}
export type AdminResourceSearch = {
  readonly items: readonly AdminResourceSearchItem[]
}
export type AdminResourceParentCommandInput = {
  readonly expectedRevision: number
  readonly parentId: string | null
}
export type AdminResourceRevisionCommandInput = {
  readonly expectedRevision: number
}
export type AdminMoveResourceNodeInput = AdminResourceRevisionCommandInput & {
  readonly destinationIndex: number
  readonly destinationParentId: string | null
}
export type AdminRenameResourceNodeInput = AdminResourceRevisionCommandInput & {
  readonly name: string
}
