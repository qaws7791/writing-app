"use client"

import { createAdminHttpTransport } from "@/lib/api/admin-http-transport"
import type { AdminApiResult } from "@/lib/api/api-result"
import { createResourceLibraryHttpAdapter } from "@/features/resources/resource-library-http-adapter"
import type {
  AdminExportResourceDocument,
  AdminImportResourceDocumentInput,
  AdminImportResourceDocumentResult,
  AdminMoveResourceNodeInput,
  AdminRenameResourceNodeInput,
  AdminResourceActiveEditorCount,
  AdminResourceDocumentSync,
  AdminResourceDocumentTransactionInput,
  AdminResourceDocumentTransactionResult,
  AdminResourceLibraryDocument,
  AdminResourceNodeMutation,
  AdminResourceParentCommandInput,
  AdminResourceRestoreResult,
  AdminResourceRevisionCommandInput,
  AdminResourceSearch,
  AdminResourceTrashResult,
  AdminResourceTree,
} from "@/features/resources/resource-library-model"
import type { AdminApiBaseUrl } from "@/runtime-config"

export type ResourceTreeApi = {
  readonly createResourceDocumentNode: (
    input: AdminResourceParentCommandInput
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly createResourceFolder: (
    input: AdminResourceParentCommandInput
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly getResourceActiveEditorCount: (
    nodeId: string
  ) => Promise<AdminApiResult<AdminResourceActiveEditorCount>>
  readonly getResourceTree: (input: {
    readonly parentId: string | null
    readonly scope: "active" | "trash"
  }) => Promise<AdminApiResult<AdminResourceTree>>
  readonly importResourceDocument: (
    input: AdminImportResourceDocumentInput
  ) => Promise<AdminApiResult<AdminImportResourceDocumentResult>>
  readonly moveResourceNode: (
    nodeId: string,
    input: AdminMoveResourceNodeInput
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly renameResourceNode: (
    nodeId: string,
    input: AdminRenameResourceNodeInput
  ) => Promise<AdminApiResult<AdminResourceNodeMutation>>
  readonly restoreResourceNode: (
    nodeId: string,
    input: AdminResourceRevisionCommandInput
  ) => Promise<AdminApiResult<AdminResourceRestoreResult>>
  readonly searchResources: (input: {
    readonly limit: number
    readonly query: string
    readonly scope: "active" | "trash"
  }) => Promise<AdminApiResult<AdminResourceSearch>>
  readonly trashResourceNode: (
    nodeId: string,
    input: AdminResourceRevisionCommandInput
  ) => Promise<AdminApiResult<AdminResourceTrashResult>>
}

export type ResourceDocumentEditorApi = {
  readonly exportResourceDocument: (
    documentId: string
  ) => Promise<AdminApiResult<AdminExportResourceDocument>>
}

export type ResourceDocumentReaderApi = {
  readonly getResourceLibraryDocument: (
    documentId: string
  ) => Promise<AdminApiResult<AdminResourceLibraryDocument>>
}

export type ResourceWorkspaceSyncApi = {
  readonly getResourceDocumentSnapshot: (
    documentId: string
  ) => Promise<AdminApiResult<AdminResourceDocumentSync>>
  readonly getResourceDocumentSync: (
    documentId: string,
    afterStateVersion: number
  ) => Promise<AdminApiResult<AdminResourceDocumentSync>>
  readonly saveResourceDocumentTransaction: (
    documentId: string,
    input: AdminResourceDocumentTransactionInput
  ) => Promise<AdminApiResult<AdminResourceDocumentTransactionResult>>
}

export type ResourceLibraryApi = ResourceDocumentEditorApi &
  ResourceDocumentReaderApi &
  ResourceTreeApi &
  ResourceWorkspaceSyncApi

export function createBrowserResourceLibraryApi(
  apiBaseUrl: AdminApiBaseUrl
): ResourceLibraryApi {
  return createResourceLibraryHttpAdapter(
    createAdminHttpTransport({
      baseUrl: apiBaseUrl,
      fetch: globalThis.fetch.bind(globalThis),
      tokenProvider: () => null,
    })
  )
}
