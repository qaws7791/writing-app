import {
  adminImportResourceDocumentResultDtoSchema,
  adminResourceDocumentDtoSchema,
  adminResourceNodeMutationDtoSchema,
  adminResourceRestoreResultDtoSchema,
  adminResourceSearchDtoSchema,
  adminResourceTrashResultDtoSchema,
  adminResourceTreeDtoSchema,
  adminResourceImageUploadDtoSchema,
} from "@workspace/contracts/admin"

import type {
  AdminResourceDocument,
  AdminResourceImage,
  ResourceLibraryHttpApi,
} from "@/features/resources/resource-library-model"
import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"

export function createResourceLibraryHttpAdapter(
  transport: AdminHttpTransport
): ResourceLibraryHttpApi {
  const mutation = (method: "PATCH" | "POST", path: string, body?: unknown) =>
    transport.requestJson({
      ...(body === undefined ? {} : { body }),
      method,
      path,
      schema: adminResourceNodeMutationDtoSchema,
    })

  return {
    createResourceDocument: (parentId) =>
      mutation("POST", "/resources/documents", { parentId }),
    createResourceFolder: (parentId) =>
      mutation("POST", "/resources/folders", { parentId }),
    deleteResourceNode: (nodeId) =>
      transport.requestJson({
        method: "DELETE",
        path: `/resources/nodes/${nodeId}`,
        schema: adminResourceTrashResultDtoSchema,
      }),
    async exportResourceDocument(documentId) {
      const result = await transport.requestDownload({
        contentType: "text/markdown",
        path: `/resources/documents/${documentId}/export`,
      })
      return result.status === "error"
        ? result
        : {
            status: "ok",
            value: {
              fileName: result.value.fileName,
              markdown: result.value.body,
            },
          }
    },
    getResourceDocument: (documentId) =>
      transport.requestJson({
        method: "GET",
        path: `/resources/documents/${documentId}`,
        schema: adminResourceDocumentDtoSchema,
      }),
    getResourceTree: (scope) =>
      transport.requestJson({
        method: "GET",
        path: `/resources/tree?scope=${scope}`,
        schema: adminResourceTreeDtoSchema,
      }),
    importResourceDocument: (input) =>
      transport.requestJson({
        body: input,
        method: "POST",
        path: "/resources/documents/import",
        schema: adminImportResourceDocumentResultDtoSchema,
      }),
    moveResourceNode: (nodeId, input) =>
      mutation("PATCH", `/resources/nodes/${nodeId}/move`, input),
    renameResourceFolder: (folderId, input) =>
      mutation("PATCH", `/resources/folders/${folderId}/name`, input),
    restoreResourceNode: (nodeId) =>
      transport.requestJson({
        method: "POST",
        path: `/resources/nodes/${nodeId}/restore`,
        schema: adminResourceRestoreResultDtoSchema,
      }),
    searchResources: (query) =>
      transport.requestJson({
        method: "GET",
        path: `/resources/search?query=${encodeURIComponent(query)}&limit=20`,
        schema: adminResourceSearchDtoSchema,
      }),
    trashResourceNode: (nodeId) =>
      transport.requestJson({
        method: "POST",
        path: `/resources/nodes/${nodeId}/trash`,
        schema: adminResourceTrashResultDtoSchema,
      }),
  }
}

export function parseResourceDocument(
  value: unknown
): AdminResourceDocument | null {
  const result = adminResourceDocumentDtoSchema.safeParse(value)
  return result.success ? result.data : null
}

export function parseResourceImage(value: unknown): AdminResourceImage | null {
  const result = adminResourceImageUploadDtoSchema.safeParse(value)
  return result.success ? result.data : null
}
