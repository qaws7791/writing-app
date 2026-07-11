import { describe, expect, it } from "vitest"

import { createResourceDocumentUseCase } from "@workspace/core/modules/resource-library/application/use-cases/resource-document.use-case"
import { createResourceSearchUseCase } from "@workspace/core/modules/resource-library/application/use-cases/resource-search.use-case"
import { createResourceTreeUseCase } from "@workspace/core/modules/resource-library/application/use-cases/resource-tree.use-case"
import {
  toResourceAuditEventId,
  toResourceDocumentId,
  toResourceFolderId,
} from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { createDrizzleResourceDocumentRepository } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-document-drizzle.repository"
import { createDrizzleResourceSearchRepository } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-search-drizzle.repository"
import { createDrizzleResourceTreeRepository } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-tree-drizzle.repository"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

const now = new Date("2026-07-10T00:00:00.000Z")

describe("자료실 use case", () => {
  it("트리 생성, Markdown 가져오기·내보내기, 경로와 FTS 검색을 연결한다", async () => {
    const fixture = createFixture()

    try {
      await expect(
        fixture.tree.createFolder({
          actorId: "admin-1",
          expectedRevision: 0,
          now,
          parentId: null,
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: {
          node: { id: "folder-1", kind: "folder", name: "새 폴더" },
          revision: 1,
        },
      })
      await expect(
        fixture.tree.createDocument({
          actorId: "admin-1",
          expectedRevision: 1,
          now,
          parentId: "folder-1",
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: {
          node: {
            id: "document-empty",
            kind: "document",
            name: "제목 없음",
          },
          revision: 2,
        },
      })
      await expect(
        fixture.tree.getTree({ parentId: null, scope: "active" })
      ).resolves.toEqual({
        nodes: [
          expect.objectContaining({
            hasChildren: true,
            id: "folder-1",
            kind: "folder",
          }),
        ],
        revision: 2,
      })

      const imported = await fixture.document.importDocument({
        actorId: "admin-1",
        expectedRevision: 2,
        fileName: "fallback-name.md",
        markdown: "# **운영** 안내\n\n실시간 공동 편집 본문",
        now,
        parentId: "folder-1",
      })

      expect(imported).toMatchObject({
        kind: "ok",
        value: {
          document: {
            id: "document-import",
            name: "운영 안내",
            path: [{ id: "folder-1", name: "새 폴더" }],
          },
          mutation: { revision: 3 },
        },
      })
      await expect(
        fixture.tree.getSubtreeDocumentIds("folder-1")
      ).resolves.toEqual(["document-empty", "document-import"])
      const activeDocument = await fixture.document.getDocument({
        documentId: "document-import",
      })
      expect(activeDocument).toMatchObject({
        id: "document-import",
        status: "active",
        updatedBy: { id: "admin-1", name: "관리자" },
      })
      expect(activeDocument).not.toHaveProperty("contentMarkdown")
      await expect(
        fixture.document.exportDocument({ documentId: "document-import" })
      ).resolves.toEqual({
        kind: "ok",
        value: {
          fileName: "운영 안내.md",
          markdown: "# 운영 안내\n\n실시간 공동 편집 본문",
        },
      })
      await expect(
        fixture.search.search({ limit: 20, query: "공동", scope: "active" })
      ).resolves.toEqual({
        items: [
          {
            excerpt: "실시간 공동 편집 본문",
            id: "document-import",
            kind: "document",
            name: "운영 안내",
            path: [{ id: "folder-1", name: "새 폴더" }],
          },
        ],
      })
      await expect(
        fixture.search.search({
          limit: 20,
          query: '공동, "편집"',
          scope: "active",
        })
      ).resolves.toMatchObject({
        items: [{ id: "document-import", kind: "document" }],
      })
      await expect(
        fixture.search.search({ limit: 20, query: "새", scope: "active" })
      ).resolves.toMatchObject({
        items: [{ excerpt: null, id: "folder-1", kind: "folder" }],
      })
      await expect(
        fixture.search.search({ limit: 20, query: "---", scope: "active" })
      ).resolves.toEqual({ items: [] })
      await expect(
        fixture.tree.trashNode({
          actorId: "admin-1",
          expectedRevision: 3,
          nodeId: "document-import",
          now,
        })
      ).resolves.toMatchObject({ kind: "ok", value: { revision: 4 } })
      await expect(
        fixture.tree.getSubtreeDocumentIds("document-import")
      ).resolves.toEqual([])
      await expect(
        fixture.document.getDocument({ documentId: "document-import" })
      ).resolves.toMatchObject({
        contentMarkdown: "실시간 공동 편집 본문",
        id: "document-import",
        status: "archived",
      })
      await expect(
        fixture.search.search({ limit: 20, query: "공동", scope: "active" })
      ).resolves.toEqual({ items: [] })
      await expect(
        fixture.search.search({ limit: 20, query: "공동", scope: "trash" })
      ).resolves.toMatchObject({
        items: [{ id: "document-import", kind: "document" }],
      })
      await expect(
        fixture.tree.restoreNode({
          actorId: "admin-1",
          expectedRevision: 4,
          nodeId: "document-import",
          now,
        })
      ).resolves.toMatchObject({ kind: "ok", value: { revision: 5 } })
    } finally {
      fixture.client.close()
    }
  })

  it("파일명 제목을 사용하고 지원하지 않는 Markdown은 DB 변경 전에 거부한다", async () => {
    const fixture = createFixture()

    try {
      await expect(
        fixture.document.importDocument({
          actorId: "admin-1",
          expectedRevision: 0,
          fileName: "파일명 제목.md",
          markdown: "## 시작\n\n본문",
          now,
          parentId: null,
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: {
          document: { name: "파일명 제목" },
          mutation: { revision: 1 },
        },
      })
      await expect(
        fixture.document.importDocument({
          actorId: "admin-1",
          expectedRevision: 1,
          fileName: "거부.md",
          markdown: "#### 지원하지 않는 제목",
          now,
          parentId: null,
        })
      ).resolves.toMatchObject({ kind: "invalid-markdown" })
      await expect(
        fixture.tree.getTree({ parentId: null, scope: "active" })
      ).resolves.toMatchObject({ revision: 1 })
    } finally {
      fixture.client.close()
    }
  })
})

function createFixture() {
  const client = createInMemoryWritingAppDatabase()
  runBaselineMigration(client.sqlite)
  insertAdminUser(client.sqlite)

  const treeRepository = createDrizzleResourceTreeRepository(client.db)
  const documentRepository = createDrizzleResourceDocumentRepository(client.db)
  const searchRepository = createDrizzleResourceSearchRepository(client.db)
  const folderIds = [toResourceFolderId("folder-1")]
  const documentIds = [
    toResourceDocumentId("document-empty"),
    toResourceDocumentId("document-import"),
  ]
  let auditSequence = 0

  const createAuditEventId = () => {
    auditSequence += 1
    return toResourceAuditEventId(`audit-${auditSequence}`)
  }

  return {
    client,
    document: createResourceDocumentUseCase({
      createAuditEventId,
      createDocumentId: () => takeFirst(documentIds),
      documentRepository,
    }),
    search: createResourceSearchUseCase(searchRepository),
    tree: createResourceTreeUseCase({
      createAuditEventId,
      createDocumentId: () => takeFirst(documentIds),
      createFolderId: () => takeFirst(folderIds),
      treeRepository,
    }),
  }
}

function takeFirst<TValue>(values: TValue[]): TValue {
  const value = values.shift()

  if (value === undefined) {
    throw new Error("테스트 ID가 부족합니다.")
  }

  return value
}

function insertAdminUser(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    INSERT INTO admin_user (
      id, name, email, email_verified, role, created_at, updated_at
    ) VALUES (
      'admin-1', '관리자', 'admin@example.com', 1, 'operator', 1, 1
    );
  `)
}
