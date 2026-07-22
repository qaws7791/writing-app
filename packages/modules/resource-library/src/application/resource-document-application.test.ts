import { describe, expect, it, vi } from "vitest"
import type { AdminId } from "@workspace/types/ids"

import { createResourceDocumentApplication } from "#resource-library/application/resource-document-application"
import type { ResourceDocumentRepository } from "#resource-library/application/ports/resource-library-ports"
import type { ResourceActor } from "#resource-library/domain/resource-access-policy"
import type { ResourceDocumentRecord } from "#resource-library/domain/resource-document"
import { readResourceDocumentId } from "#resource-library/domain/resource-tree-node"

type DocumentDependencies = Parameters<
  typeof createResourceDocumentApplication
>[0]

const now = new Date("2026-07-18T00:00:00.000Z")
const adminId = "admin-1" as AdminId
const documentId = readResourceDocumentId("document-1")
const actor: ResourceActor = Object.freeze({
  access: "allowed",
  email: "admin@example.com",
  id: adminId,
  name: "관리자",
})
const record: ResourceDocumentRecord = Object.freeze({
  contentMarkdown: "기존 본문",
  createdAt: now,
  createdById: adminId,
  id: documentId,
  name: "운영 기준",
  parentId: null,
  path: Object.freeze([]),
  status: "active",
  updatedAt: now,
  updatedById: adminId,
  version: 3,
})

describe("resource document application", () => {
  it("stale 저장을 최신 hydrated document가 있는 conflict로 반환한다", async () => {
    const application = createResourceDocumentApplication(
      createDependencies({
        documentRepository: createDocumentRepository({
          saveDocument: async () => ({
            document: record,
            kind: "stale-version",
          }),
        }),
      })
    )

    await expect(
      application.saveDocument({
        actor,
        contentMarkdown: "새 본문",
        documentId,
        expectedVersion: 2,
        name: "새 제목",
      })
    ).resolves.toMatchObject({
      document: {
        createdBy: { id: adminId },
        id: documentId,
        updatedBy: { id: adminId },
        version: 3,
      },
      kind: "resource-conflict",
      reason: "stale-version",
    })
  })

  it("forbidden과 Markdown validation 실패를 repository 전에 거절한다", async () => {
    const saveDocument = vi.fn(async () => ({
      kind: "ok" as const,
      value: record,
    }))
    const application = createResourceDocumentApplication(
      createDependencies({
        codec: {
          normalize: () => ({
            issues: [{ code: "markdown-round-trip-mismatch" }],
            status: "invalid",
          }),
          prepareImport: () => ({
            markdown: "",
            headingTitle: null,
            status: "valid",
          }),
          readPlainText: () => ({ status: "valid", text: "" }),
        },
        documentRepository: createDocumentRepository({ saveDocument }),
      })
    )

    await expect(
      application.saveDocument({
        actor: { ...actor, access: "forbidden" },
        contentMarkdown: "본문",
        documentId,
        expectedVersion: 3,
        name: "운영 기준",
      })
    ).resolves.toEqual({ kind: "resource-forbidden" })
    await expect(
      application.saveDocument({
        actor,
        contentMarkdown: "본문",
        documentId,
        expectedVersion: 3,
        name: "운영 기준",
      })
    ).resolves.toEqual({
      issues: [{ code: "markdown-round-trip-mismatch" }],
      kind: "resource-validation",
      reason: "markdown-invalid",
    })
    expect(saveDocument).not.toHaveBeenCalled()
  })

  it("가져오기 파일명과 persistence exception을 구분한다", async () => {
    const application = createResourceDocumentApplication(
      createDependencies({
        documentRepository: createDocumentRepository({
          importDocument: async () =>
            Promise.reject(new Error("database down")),
        }),
      })
    )

    await expect(
      application.importDocument({
        actor,
        fileName: "운영.txt",
        markdown: "본문",
        parentId: null,
      })
    ).resolves.toEqual({
      kind: "resource-validation",
      reason: "file-name-invalid",
    })
    await expect(
      application.importDocument({
        actor,
        fileName: "운영.md",
        markdown: "본문",
        parentId: null,
      })
    ).resolves.toEqual({
      kind: "resource-persistence-failure",
      operation: "import-document",
    })
  })

  it("내보내기는 제목과 본문을 결합하고 없는 문서를 구분한다", async () => {
    const application = createResourceDocumentApplication(createDependencies())
    await expect(application.exportDocument(documentId)).resolves.toEqual({
      kind: "ok",
      value: {
        fileName: "운영 기준.md",
        markdown: "# 운영 기준\n\n기존 본문",
      },
    })
    const missing = createResourceDocumentApplication(
      createDependencies({
        documentRepository: createDocumentRepository({
          readDocument: async () => null,
        }),
      })
    )
    await expect(missing.exportDocument(documentId)).resolves.toEqual({
      kind: "resource-not-found",
      target: "document",
    })
  })
})

function createDependencies(
  overrides: Partial<DocumentDependencies> = {}
): DocumentDependencies {
  return {
    actorDirectory: {
      readActors: async () => [
        { email: actor.email, id: actor.id, name: actor.name },
      ],
    },
    clock: { now: () => now },
    codec: {
      normalize: (markdown) => ({ markdown, status: "valid" }),
      prepareImport: (markdown) => ({
        headingTitle: null,
        markdown,
        status: "valid",
      }),
      readPlainText: (markdown) => ({ status: "valid", text: markdown }),
    },
    documentIdGenerator: { next: () => documentId },
    documentRepository: createDocumentRepository(),
    ...overrides,
  }
}

function createDocumentRepository(
  overrides: Partial<ResourceDocumentRepository> = {}
): ResourceDocumentRepository {
  return {
    importDocument: async () => ({
      kind: "ok",
      value: {
        document: record,
        node: {
          id: documentId,
          kind: "document",
          name: record.name,
          normalizedName: record.name,
          parentId: null,
          status: "active",
          trashRootId: null,
        },
      },
    }),
    readDocument: async () => record,
    saveDocument: async () => ({ kind: "ok", value: record }),
    ...overrides,
  }
}
