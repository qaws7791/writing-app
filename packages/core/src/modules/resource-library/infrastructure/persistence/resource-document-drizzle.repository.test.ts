import { describe, expect, it } from "vitest"

import { toResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { createDrizzleResourceDocumentRepository } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-document-drizzle.repository"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

describe("자료 문서 Drizzle repository", () => {
  it("활성 문서 메타데이터와 Markdown 본문을 별도 조회한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    runBaselineMigration(client.sqlite)
    client.sqlite.exec(`
      INSERT INTO admin_user (
        id, name, email, email_verified, role, created_at, updated_at
      ) VALUES ('admin-1', '관리자', 'admin@example.com', 1, 'operator', 1, 1);
      INSERT INTO admin_resource_nodes (
        id, kind, parent_id, name, normalized_name, sort_order, status,
        trash_root_id, created_by, updated_by, created_at, updated_at
      ) VALUES
        ('document-1', 'document', NULL, '문서 1', '문서 1', 0, 'active', NULL, 'admin-1', 'admin-1', 1, 1),
        ('document-2', 'document', NULL, '문서 2', '문서 2', 1, 'active', NULL, 'admin-1', 'admin-1', 1, 1);
      INSERT INTO admin_resource_documents (
        node_id, content_markdown, content_revision
      ) VALUES
        ('document-1', '본문 1', 3),
        ('document-2', '본문 2', 0);
      INSERT INTO admin_resource_collaboration (
        document_id, yjs_state, state_version, projected_at
      ) VALUES ('document-1', X'010203', 4, 1);
    `)
    const repository = createDrizzleResourceDocumentRepository(client.db)

    try {
      await expect(
        repository.readDocumentMetadata(toResourceDocumentId("document-1"))
      ).resolves.toEqual({
        contentRevision: 3,
        createdAt: new Date(1),
        createdBy: {
          email: "admin@example.com",
          id: "admin-1",
          name: "관리자",
        },
        id: "document-1",
        name: "문서 1",
        parentId: null,
        path: [],
        stateVersion: 4,
        status: "active",
        updatedAt: new Date(1),
        updatedBy: {
          email: "admin@example.com",
          id: "admin-1",
          name: "관리자",
        },
      })
      await expect(
        repository.readDocumentContent(toResourceDocumentId("document-1"))
      ).resolves.toBe("본문 1")
      await expect(
        repository.readDocumentMetadata(toResourceDocumentId("document-2"))
      ).resolves.toMatchObject({ stateVersion: 0 })
    } finally {
      client.close()
    }
  })
})
