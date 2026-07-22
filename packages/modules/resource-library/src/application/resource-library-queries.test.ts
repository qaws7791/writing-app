import { describe, expect, it, vi } from "vitest"
import type { AdminId } from "@workspace/types/ids"

import {
  createResourceDocumentQuery,
  createResourceLibraryKnowledgeQuery,
} from "#resource-library/application/resource-library-queries"
import type { ResourceDocumentRecord } from "#resource-library/domain/resource-document"
import { readResourceDocumentId } from "#resource-library/domain/resource-tree-node"

const adminId = "admin-1" as AdminId
const documentId = readResourceDocumentId("document-1")
const record: ResourceDocumentRecord = Object.freeze({
  contentMarkdown: "본문",
  createdAt: new Date("2026-07-18T00:00:00.000Z"),
  createdById: adminId,
  id: documentId,
  name: "운영 기준",
  parentId: null,
  path: Object.freeze([]),
  status: "active",
  updatedAt: new Date("2026-07-18T00:00:00.000Z"),
  updatedById: adminId,
  version: 1,
})

describe("resource-library queries", () => {
  it("actor directory로 문서 표시 정보를 hydrate한다", async () => {
    const readActors = vi.fn(async () => [
      { email: "admin@example.com", id: adminId, name: "관리자" },
    ])
    const query = createResourceDocumentQuery({
      actorDirectory: { readActors },
      repository: {
        importDocument: async () => ({
          kind: "resource-not-found",
          target: "parent",
        }),
        readDocument: async () => record,
        saveDocument: async () => ({
          kind: "resource-not-found",
          target: "document",
        }),
      },
    })

    await expect(query.readDocument(documentId)).resolves.toMatchObject({
      createdBy: { id: adminId },
      updatedBy: { id: adminId },
    })
    expect(readActors).toHaveBeenCalledWith([adminId, adminId])
  })

  it("AI knowledge query는 휴지통 문서를 직접 조회하지 못하게 한다", async () => {
    const readDocument = vi
      .fn()
      .mockResolvedValueOnce({
        ...toHydratedDocument(record),
        status: "trashed",
      })
      .mockResolvedValueOnce(toHydratedDocument(record))
    const knowledge = createResourceLibraryKnowledgeQuery({
      documents: { readDocument },
      search: { search: async () => [] },
    })

    await expect(
      knowledge.documents.readDocument(documentId)
    ).resolves.toBeNull()
    await expect(
      knowledge.documents.readDocument(documentId)
    ).resolves.toMatchObject({ status: "active" })
  })
})

function toHydratedDocument(input: ResourceDocumentRecord) {
  const profile = {
    email: "admin@example.com",
    id: adminId,
    name: "관리자",
  }
  const {
    createdById: _createdById,
    updatedById: _updatedById,
    ...document
  } = input
  return { ...document, createdBy: profile, updatedBy: profile }
}
