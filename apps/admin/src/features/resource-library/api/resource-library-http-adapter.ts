import {
  adminImportResourceDocumentResultDtoSchema,
  adminResourceNodeMutationDtoSchema,
  adminResourceRestoreResultDtoSchema,
  adminResourceSearchDtoSchema,
  adminResourceTrashResultDtoSchema,
  adminResourceTreeDtoSchema,
} from "@workspace/contracts/admin"

import type { ResourceLibraryApi } from "@/entities/resource-document/model/resource-document"
import type { AdminHttpTransport } from "@/shared/http/admin-http-transport"

export function createResourceLibraryHttpAdapter(
  transport: AdminHttpTransport
): ResourceLibraryApi {
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
