import type {
  AdminHttpTransport,
  AdminResponseSchema,
} from "@/lib/api/admin-http-transport"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { ResourceLibraryApi } from "@/features/resources/resource-library-api"
import type {
  AdminImportResourceDocumentResult,
  AdminResourceDocumentSync,
  AdminResourceDocumentTransactionResult,
  AdminResourceLibraryDocument,
  AdminResourceNodeMutation,
  AdminResourceRestoreResult,
  AdminResourceSearch,
  AdminResourceTrashResult,
  AdminResourceTree,
  AdminResourceTreeNode,
} from "@/features/resources/resource-library-model"
import {
  adminImportResourceDocumentResultDtoSchema,
  adminReadResourceDocumentSyncResponseSchema,
  adminResourceActiveEditorCountDtoSchema,
  adminResourceDocumentDtoSchema,
  adminResourceNodeMutationDtoSchema,
  adminResourceRestoreResultDtoSchema,
  adminResourceSearchDtoSchema,
  adminResourceTrashResultDtoSchema,
  adminResourceTreeDtoSchema,
  adminSaveResourceDocumentTransactionResponseSchema,
  type AdminImportResourceDocumentResultDto,
  type AdminReadResourceDocumentSyncResponse,
  type AdminResourceDocumentDto,
  type AdminResourceNodeMutationDto,
  type AdminResourceRestoreResultDto,
  type AdminResourceSearchDto,
  type AdminResourceTrashMutationDto,
  type AdminResourceTrashResultDto,
  type AdminResourceTreeDto,
  type AdminResourceTreeNodeDto,
  type AdminSaveResourceDocumentTransactionResponse,
} from "@workspace/contracts/admin"

export function createResourceLibraryHttpAdapter(
  transport: AdminHttpTransport
): ResourceLibraryApi {
  const request = <TWire, TModel>(input: {
    readonly body?: unknown
    readonly method: "GET" | "PATCH" | "POST"
    readonly path: string
    readonly schema: AdminResponseSchema<TWire>
    readonly map: (dto: TWire) => TModel
  }) => {
    const requestInput =
      input.body === undefined
        ? { method: input.method, path: input.path, schema: input.schema }
        : {
            body: input.body,
            method: input.method,
            path: input.path,
            schema: input.schema,
          }
    return transport
      .requestJson(requestInput)
      .then((result) => mapResult(result, input.map))
  }
  const mutation = (method: "PATCH" | "POST", path: string, body: unknown) =>
    request({
      body,
      method,
      path,
      schema: adminResourceNodeMutationDtoSchema,
      map: toMutation,
    })

  return {
    createResourceDocumentNode: (input) =>
      mutation("POST", "/resources/documents", input),
    createResourceFolder: (input) =>
      mutation("POST", "/resources/folders", input),
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
    getResourceActiveEditorCount: (nodeId) =>
      request({
        method: "GET",
        path: `/resources/nodes/${nodeId}/active-editors`,
        schema: adminResourceActiveEditorCountDtoSchema,
        map: (dto) => ({ activeEditorCount: dto.activeEditorCount }),
      }),
    getResourceDocumentSnapshot: (documentId) =>
      request({
        method: "GET",
        path: `/resources/documents/${documentId}/sync?afterStateVersion=0&mode=snapshot`,
        schema: adminReadResourceDocumentSyncResponseSchema,
        map: toSync,
      }),
    getResourceDocumentSync: (documentId, afterStateVersion) =>
      request({
        method: "GET",
        path: `/resources/documents/${documentId}/sync?afterStateVersion=${afterStateVersion}`,
        schema: adminReadResourceDocumentSyncResponseSchema,
        map: toSync,
      }),
    getResourceLibraryDocument: (documentId) =>
      request({
        method: "GET",
        path: `/resources/documents/${documentId}`,
        schema: adminResourceDocumentDtoSchema,
        map: toDocument,
      }),
    getResourceTree: (input) =>
      request({
        method: "GET",
        path: `/resources/tree?${treeParams(input)}`,
        schema: adminResourceTreeDtoSchema,
        map: toTree,
      }),
    importResourceDocument: (input) =>
      request({
        body: input,
        method: "POST",
        path: "/resources/documents/import",
        schema: adminImportResourceDocumentResultDtoSchema,
        map: toImportResult,
      }),
    moveResourceNode: (nodeId, input) =>
      mutation("PATCH", `/resources/nodes/${nodeId}/move`, input),
    renameResourceNode: (nodeId, input) =>
      mutation("PATCH", `/resources/nodes/${nodeId}/name`, input),
    restoreResourceNode: (nodeId, input) =>
      request({
        body: input,
        method: "POST",
        path: `/resources/nodes/${nodeId}/restore`,
        schema: adminResourceRestoreResultDtoSchema,
        map: toRestore,
      }),
    saveResourceDocumentTransaction: (documentId, input) =>
      request({
        body: {
          knownStateVersion: input.knownStateVersion,
          transactionId: input.transactionId,
          updateBase64: encodeBase64(input.update),
        },
        method: "POST",
        path: `/resources/documents/${documentId}/transactions`,
        schema: adminSaveResourceDocumentTransactionResponseSchema,
        map: toTransaction,
      }),
    searchResources: (input) =>
      request({
        method: "GET",
        path: `/resources/search?${searchParams(input)}`,
        schema: adminResourceSearchDtoSchema,
        map: toSearch,
      }),
    trashResourceNode: (nodeId, input) =>
      request({
        body: input,
        method: "POST",
        path: `/resources/nodes/${nodeId}/trash`,
        schema: adminResourceTrashResultDtoSchema,
        map: toTrash,
      }),
  }
}

function mapResult<TWire, TModel>(
  result: AdminApiResult<TWire>,
  map: (dto: TWire) => TModel
): AdminApiResult<TModel> {
  return result.status === "error"
    ? result
    : { status: "ok", value: map(result.value) }
}

function toTree(dto: AdminResourceTreeDto): AdminResourceTree {
  return { nodes: dto.nodes.map(toNode), revision: dto.revision }
}
function toNode(dto: AdminResourceTreeNodeDto): AdminResourceTreeNode {
  const node = {
    id: dto.id,
    name: dto.name,
    parentId: dto.parentId,
    sortOrder: dto.sortOrder,
    status: dto.status,
  }
  return dto.kind === "folder"
    ? { ...node, hasChildren: dto.hasChildren, kind: "folder" }
    : { ...node, hasChildren: false, kind: "document" }
}
function toMutation(
  dto: AdminResourceNodeMutationDto
): AdminResourceNodeMutation {
  return {
    affectedParentIds: [...dto.affectedParentIds],
    node: toNode(dto.node),
    revision: dto.revision,
  }
}
function toSubtree(dto: AdminResourceTrashMutationDto) {
  return {
    affectedParentIds: [...dto.affectedParentIds],
    documentCount: dto.documentCount,
    folderCount: dto.folderCount,
    revision: dto.revision,
  }
}
function toTrash(dto: AdminResourceTrashResultDto): AdminResourceTrashResult {
  return toSubtree(dto)
}
function toRestore(
  dto: AdminResourceRestoreResultDto
): AdminResourceRestoreResult {
  return { ...toSubtree(dto), node: toNode(dto.node) }
}
function toDocument(
  dto: AdminResourceDocumentDto
): AdminResourceLibraryDocument {
  const common = {
    contentRevision: dto.contentRevision,
    createdAt: dto.createdAt,
    createdBy: { ...dto.createdBy },
    id: dto.id,
    name: dto.name,
    parentId: dto.parentId,
    path: dto.path.map((item) => ({ ...item })),
    stateVersion: dto.stateVersion,
    updatedAt: dto.updatedAt,
    updatedBy: { ...dto.updatedBy },
  }
  return dto.status === "archived"
    ? { ...common, contentMarkdown: dto.contentMarkdown, status: "archived" }
    : { ...common, status: "active" }
}
function toSync(
  dto: AdminReadResourceDocumentSyncResponse
): AdminResourceDocumentSync {
  if (dto.kind === "up-to-date") return dto
  if (dto.kind === "snapshot") {
    return {
      kind: "snapshot",
      snapshot: decodeBase64(dto.snapshotBase64),
      stateVersion: dto.stateVersion,
    }
  }
  return {
    fromStateVersion: dto.fromStateVersion,
    kind: "updates",
    stateVersion: dto.stateVersion,
    updates: dto.updatesBase64.map(decodeBase64),
  }
}
function toTransaction(
  dto: AdminSaveResourceDocumentTransactionResponse
): AdminResourceDocumentTransactionResult {
  return { ...dto }
}
function toImportResult(
  dto: AdminImportResourceDocumentResultDto
): AdminImportResourceDocumentResult {
  const document = toDocument(dto.document)
  if (document.status !== "active")
    throw new Error("가져온 자료 문서가 활성 상태가 아닙니다.")
  return { document, mutation: toMutation(dto.mutation) }
}
function toSearch(dto: AdminResourceSearchDto): AdminResourceSearch {
  return {
    items: dto.items.map((item) => ({
      ...item,
      path: item.path.map((path) => ({ ...path })),
    })),
  }
}
function encodeBase64(value: Uint8Array): string {
  let binary = ""
  for (const byte of value) binary += String.fromCharCode(byte)
  return btoa(binary)
}
function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}
function treeParams(input: {
  readonly parentId: string | null
  readonly scope: "active" | "trash"
}) {
  const params = new URLSearchParams()
  if (input.parentId !== null) params.set("parentId", input.parentId)
  params.set("scope", input.scope)
  return params.toString()
}
function searchParams(input: {
  readonly limit: number
  readonly query: string
  readonly scope: "active" | "trash"
}) {
  const params = new URLSearchParams()
  params.set("limit", String(input.limit))
  params.set("query", input.query)
  params.set("scope", input.scope)
  return params.toString()
}
