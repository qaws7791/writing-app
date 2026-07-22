import type { ResourceDocumentId } from "@workspace/types/ids"

import type {
  ResourceActorDirectoryPort,
  ResourceDocumentRepository,
  ResourceSearchRecord,
  ResourceSearchRepository,
} from "#resource-library/application/ports/resource-library-ports"
import type { ResourceDocument } from "#resource-library/domain/resource-document"
import type { ResourceDocumentRecord } from "#resource-library/domain/resource-document"

export type ResourceDocumentQuery = Readonly<{
  readDocument: (
    documentId: ResourceDocumentId
  ) => Promise<ResourceDocument | null>
}>

export type ResourceSearchQuery = Readonly<{
  search: (input: {
    readonly limit: number
    readonly query: string
  }) => Promise<readonly ResourceSearchRecord[]>
}>

export type ResourceLibraryKnowledgeQuery = Readonly<{
  documents: ResourceDocumentQuery
  search: ResourceSearchQuery
}>

export function createResourceDocumentQuery(input: {
  readonly actorDirectory: ResourceActorDirectoryPort
  readonly repository: ResourceDocumentRepository
}): ResourceDocumentQuery {
  return Object.freeze({
    async readDocument(documentId) {
      const record = await input.repository.readDocument(documentId)
      return record === null
        ? null
        : hydrateResourceDocument(record, input.actorDirectory)
    },
  })
}

export function createResourceSearchQuery(
  repository: ResourceSearchRepository
): ResourceSearchQuery {
  return Object.freeze({
    search(query) {
      return repository.search(query)
    },
  })
}

export function createResourceLibraryKnowledgeQuery(input: {
  readonly documents: ResourceDocumentQuery
  readonly search: ResourceSearchQuery
}): ResourceLibraryKnowledgeQuery {
  return Object.freeze({
    documents: Object.freeze({
      async readDocument(documentId: ResourceDocumentId) {
        const document = await input.documents.readDocument(documentId)
        return document?.status === "active" ? document : null
      },
    }),
    search: input.search,
  })
}

export async function hydrateResourceDocument(
  record: ResourceDocumentRecord,
  actorDirectory: ResourceActorDirectoryPort
): Promise<ResourceDocument> {
  const actors = await actorDirectory.readActors([
    record.createdById,
    record.updatedById,
  ])
  const actorsById = new Map(actors.map((actor) => [actor.id, actor]))
  const createdBy = actorsById.get(record.createdById)
  const updatedBy = actorsById.get(record.updatedById)
  if (createdBy === undefined || updatedBy === undefined) {
    throw new Error("자료 문서의 관리자 메타데이터를 조회하지 못했습니다.")
  }

  const {
    createdById: _createdById,
    updatedById: _updatedById,
    ...document
  } = record
  return Object.freeze({
    ...document,
    createdBy,
    path: Object.freeze([...document.path]),
    updatedBy,
  })
}
