import { describe, expect, it } from "vitest"

import { toResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { createDrizzleResourceDocumentRepository } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-document-drizzle.repository"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

describe("자료 문서 Drizzle repository", () => {
  it("활성 문서에 현재 협업 state version을 포함하고 snapshot이 없으면 0을 반환한다", async () => {
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
        repository.readDocument(toResourceDocumentId("document-1"))
      ).resolves.toMatchObject({ stateVersion: 4 })
      await expect(
        repository.readDocument(toResourceDocumentId("document-2"))
      ).resolves.toMatchObject({ stateVersion: 0 })
    } finally {
      client.close()
    }
  })
})
