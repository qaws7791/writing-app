import { describe, expect, it } from "vitest"

import { toResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { createDrizzleResourceCollaborationRepository } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-collaboration-drizzle.repository"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

const documentId = toResourceDocumentId("document-1")

describe("자료 공동 편집 Drizzle repository", () => {
  it("첫 flush와 후속 flush를 snapshot·Markdown·FTS와 함께 원자 저장한다", async () => {
    const fixture = createFixture()

    try {
      await expect(fixture.repository.load(documentId)).resolves.toEqual({
        kind: "ok",
        value: {
          contentMarkdown: "초기 본문",
          snapshot: null,
          stateVersion: 0,
        },
      })

      await expect(
        fixture.repository.flush({
          actorId: "admin-2",
          bodyText: "첫 공동 편집",
          documentId,
          expectedStateVersion: 0,
          markdown: "**첫 공동 편집**",
          now: new Date("2026-07-10T01:00:00.000Z"),
          snapshot: Uint8Array.of(1, 2, 3),
        })
      ).resolves.toEqual({
        kind: "ok",
        value: { contentRevision: 1, stateVersion: 1 },
      })
      expect(readStoredState(fixture.client.sqlite)).toEqual({
        body_text: "첫 공동 편집",
        content_markdown: "**첫 공동 편집**",
        content_revision: 1,
        state_version: 1,
        updated_by: "admin-2",
        yjs_state: Uint8Array.of(1, 2, 3),
      })

      await expect(
        fixture.repository.flush({
          actorId: "admin-1",
          bodyText: "두 번째",
          documentId,
          expectedStateVersion: 0,
          markdown: "두 번째",
          now: new Date("2026-07-10T02:00:00.000Z"),
          snapshot: Uint8Array.of(4),
        })
      ).resolves.toEqual({
        actualStateVersion: 1,
        kind: "stale-state-version",
      })
      expect(readStoredState(fixture.client.sqlite)).toMatchObject({
        content_markdown: "**첫 공동 편집**",
        state_version: 1,
      })
    } finally {
      fixture.client.close()
    }
  })

  it("휴지통 문서는 load와 flush에서 inactive로 거부한다", async () => {
    const fixture = createFixture()

    try {
      fixture.client.sqlite.exec(`
        UPDATE admin_resource_nodes
        SET status = 'archived', trash_root_id = 'document-1'
        WHERE id = 'document-1'
      `)

      await expect(fixture.repository.load(documentId)).resolves.toEqual({
        kind: "inactive",
      })
      await expect(
        fixture.repository.flush({
          actorId: "admin-1",
          bodyText: "저장 금지",
          documentId,
          expectedStateVersion: 0,
          markdown: "저장 금지",
          now: new Date(),
          snapshot: Uint8Array.of(1),
        })
      ).resolves.toEqual({ kind: "inactive" })
    } finally {
      fixture.client.close()
    }
  })
})

function createFixture() {
  const client = createInMemoryWritingAppDatabase()
  runBaselineMigration(client.sqlite)
  client.sqlite.exec(`
    INSERT INTO admin_user (
      id, name, email, email_verified, role, created_at, updated_at
    ) VALUES
      ('admin-1', '관리자 1', 'admin1@example.com', 1, 'operator', 1, 1),
      ('admin-2', '관리자 2', 'admin2@example.com', 1, 'operator', 1, 1);
  `)
  client.sqlite.exec(`
    INSERT INTO admin_resource_nodes (
      id, kind, parent_id, name, normalized_name, sort_order, status,
      trash_root_id, created_by, updated_by, created_at, updated_at
    ) VALUES (
      'document-1', 'document', NULL, '문서', '문서', 0, 'active',
      NULL, 'admin-1', 'admin-1', 1, 1
    );
    INSERT INTO admin_resource_documents (
      node_id, content_markdown, content_revision
    ) VALUES ('document-1', '초기 본문', 0);
    INSERT INTO admin_resource_search (node_id, kind, name, body_text)
    VALUES ('document-1', 'document', '문서', '초기 본문');
  `)

  return {
    client,
    repository: createDrizzleResourceCollaborationRepository(client.db),
  }
}

function readStoredState(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
) {
  const row = sqlite
    .query<
      {
        readonly body_text: string
        readonly content_markdown: string
        readonly content_revision: number
        readonly state_version: number
        readonly updated_by: string
        readonly yjs_state: Uint8Array
      },
      []
    >(`
      SELECT
        search.body_text,
        document.content_markdown,
        document.content_revision,
        collaboration.state_version,
        node.updated_by,
        collaboration.yjs_state
      FROM admin_resource_documents AS document
      INNER JOIN admin_resource_nodes AS node ON node.id = document.node_id
      INNER JOIN admin_resource_collaboration AS collaboration
        ON collaboration.document_id = document.node_id
      INNER JOIN admin_resource_search AS search
        ON search.node_id = document.node_id
      WHERE document.node_id = 'document-1'
    `)
    .get()

  if (row === null) {
    throw new Error("저장된 공동 편집 상태를 찾지 못했습니다.")
  }

  return {
    ...row,
    yjs_state: Uint8Array.from(row.yjs_state),
  }
}
