import { adminImportResourceDocumentResultDtoSchema } from "@workspace/contracts/resource-library/admin-resource-documents"
import {
  adminResourceNodeMutationDtoSchema,
  adminResourceRestoreResultDtoSchema,
  adminResourceTrashResultDtoSchema,
  adminResourceTreeDtoSchema,
} from "@workspace/contracts/resource-library/admin-resource-tree"
import { adminResourceSearchDtoSchema } from "@workspace/contracts/resource-library/admin-resource-search"

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
      mutation("POST", "/api/admin/resources/documents", { parentId }),
    createResourceFolder: (parentId) =>
      mutation("POST", "/api/admin/resources/folders", { parentId }),
    deleteResourceNode: (nodeId) =>
      transport.requestJson({
        method: "DELETE",
        path: `/api/admin/resources/nodes/${nodeId}`,
        schema: adminResourceTrashResultDtoSchema,
      }),
    getResourceTree: (scope) =>
      transport.requestJson({
        method: "GET",
        path: `/api/admin/resources/tree?scope=${scope}`,
        schema: adminResourceTreeDtoSchema,
      }),
    importResourceDocument: (input) =>
      transport.requestJson({
        body: input,
        method: "POST",
        path: "/api/admin/resources/documents/import",
        schema: adminImportResourceDocumentResultDtoSchema,
      }),
    moveResourceNode: (nodeId, input) =>
      mutation("PATCH", `/api/admin/resources/nodes/${nodeId}/move`, input),
    renameResourceFolder: (folderId, input) =>
      mutation("PATCH", `/api/admin/resources/folders/${folderId}/name`, input),
    restoreResourceNode: (nodeId) =>
      transport.requestJson({
        method: "POST",
        path: `/api/admin/resources/nodes/${nodeId}/restore`,
        schema: adminResourceRestoreResultDtoSchema,
      }),
    searchResources: (query) =>
      transport.requestJson({
        method: "GET",
        path: `/api/admin/resources/search?query=${encodeURIComponent(query)}&limit=20`,
        schema: adminResourceSearchDtoSchema,
      }),
    trashResourceNode: (nodeId) =>
      transport.requestJson({
        method: "POST",
        path: `/api/admin/resources/nodes/${nodeId}/trash`,
        schema: adminResourceTrashResultDtoSchema,
      }),
  }
}
