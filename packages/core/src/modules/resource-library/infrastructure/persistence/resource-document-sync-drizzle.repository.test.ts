import { describe, expect, it } from "vitest"

import { toResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { toResourceDocumentTransactionId } from "@workspace/core/modules/resource-library/domain/resource-document-sync"
import { createDrizzleResourceDocumentSyncRepository } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-document-sync-drizzle.repository"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

const documentId = toResourceDocumentId("document-1")

describe("자료 문서 동기화 Drizzle repository", () => {
  it("같은 transaction을 한 번만 원자 저장하고 최초 승인 결과를 반환한다", async () => {
    const fixture = createFixture()
    const input = {
      actorId: "admin-2",
      bodyText: "변경 본문",
      documentId,
      expectedStateVersion: 0,
      markdown: "변경 **본문**",
      now: new Date("2026-07-11T06:00:00.000Z"),
      snapshot: Uint8Array.of(4, 5, 6),
      transactionId: toResourceDocumentTransactionId("transaction-1"),
      update: Uint8Array.of(1, 2, 3),
    }

    try {
      await expect(
        fixture.repository.commitTransaction(input)
      ).resolves.toEqual({
        contentRevision: 1,
        kind: "accepted",
        stateVersion: 1,
        transactionId: "transaction-1",
      })
      await expect(
        fixture.repository.commitTransaction({
          ...input,
          expectedStateVersion: 1,
          transactionId: toResourceDocumentTransactionId("transaction-2"),
        })
      ).resolves.toMatchObject({
        contentRevision: 2,
        kind: "accepted",
        stateVersion: 2,
      })
      await expect(
        fixture.repository.commitTransaction(input)
      ).resolves.toEqual({
        contentRevision: 1,
        kind: "already-accepted",
        stateVersion: 1,
        transactionId: "transaction-1",
      })
      expect(readStoredState(fixture.client.sqlite)).toEqual({
        body_text: "변경 본문",
        content_markdown: "변경 **본문**",
        content_revision: 2,
        receipt_count: 2,
        state_version: 2,
        update_count: 2,
        updated_by: "admin-2",
        yjs_state_hex: "040506",
      })
    } finally {
      fixture.client.close()
    }
  })

  it("누적 update가 2MiB를 넘으면 오래된 binary만 정리하고 승인 receipt는 유지한다", async () => {
    const fixture = createFixture()
    const update = new Uint8Array(512 * 1024)

    try {
      for (let index = 0; index < 5; index += 1) {
        await fixture.repository.commitTransaction({
          actorId: "admin-2",
          bodyText: `본문 ${index}`,
          documentId,
          expectedStateVersion: index,
          markdown: `본문 ${index}`,
          now: new Date(1_000 + index),
          snapshot: Uint8Array.of(index),
          transactionId: toResourceDocumentTransactionId(
            `transaction-${index}`
          ),
          update,
        })
      }

      expect(
        fixture.client.sqlite
          .query<
            { readonly first_version: number; readonly update_count: number },
            []
          >(`
            SELECT MIN(state_version) AS first_version, COUNT(*) AS update_count
            FROM admin_resource_collaboration_updates
          `)
          .get()
      ).toEqual({ first_version: 2, update_count: 4 })
      expect(
        fixture.client.sqlite
          .query<{ readonly receipt_count: number }, []>(`
            SELECT COUNT(*) AS receipt_count
            FROM admin_resource_collaboration_transactions
          `)
          .get()
      ).toEqual({ receipt_count: 5 })
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
    repository: createDrizzleResourceDocumentSyncRepository(client.db),
  }
}

function readStoredState(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
) {
  return sqlite
    .query<
      {
        readonly content_markdown: string
        readonly content_revision: number
        readonly body_text: string
        readonly receipt_count: number
        readonly state_version: number
        readonly update_count: number
        readonly updated_by: string
        readonly yjs_state_hex: string
      },
      []
    >(`
      SELECT
        document.content_markdown,
        document.content_revision,
        search.body_text,
        node.updated_by,
        collaboration.state_version,
        hex(collaboration.yjs_state) AS yjs_state_hex,
        (
          SELECT COUNT(*)
          FROM admin_resource_collaboration_transactions AS receipt
          WHERE receipt.document_id = document.node_id
        ) AS receipt_count,
        COUNT(update_log.state_version) AS update_count
      FROM admin_resource_documents AS document
      INNER JOIN admin_resource_nodes AS node
        ON node.id = document.node_id
      INNER JOIN admin_resource_collaboration AS collaboration
        ON collaboration.document_id = document.node_id
      INNER JOIN admin_resource_search AS search
        ON search.node_id = document.node_id
      LEFT JOIN admin_resource_collaboration_updates AS update_log
        ON update_log.document_id = document.node_id
      WHERE document.node_id = 'document-1'
      GROUP BY document.node_id
    `)
    .get()
}
