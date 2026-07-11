import { describe, expect, it } from "vitest"
import { applyUpdate, Doc, mergeUpdates } from "yjs"

import { createResourceDocumentSyncUseCase } from "@workspace/core/modules/resource-library/application/use-cases/resource-document-sync.use-case"
import { toResourceDocumentTransactionId } from "@workspace/core/modules/resource-library/domain/resource-document-sync"
import { toResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { createDrizzleResourceDocumentSyncRepository } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-document-sync-drizzle.repository"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import {
  createHeadlessResourceDocumentCollaboration,
  createResourceDocumentSnapshot,
  projectResourceDocumentSnapshot,
  readResourceDocumentMarkdown,
  replaceResourceDocumentMarkdown,
} from "@workspace/resource-document"

const documentId = toResourceDocumentId("document-1")

describe("자료 문서 동기화 use case", () => {
  it("Yjs transaction을 검증·투영해 승인하고 같은 멱등 키를 재사용한다", async () => {
    const initial = createResourceDocumentSnapshot("초기 본문")
    if (initial.status !== "valid") throw new Error("초기 snapshot 생성 실패")

    const fixture = createFixture(initial.snapshot)
    const useCase = createResourceDocumentSyncUseCase(fixture.repository)
    const transactionId = toResourceDocumentTransactionId("transaction-1")
    const update = createUpdate(initial.snapshot, "변경된 **본문**")
    const input = {
      actorId: "admin-2",
      documentId,
      knownStateVersion: 0,
      now: new Date("2026-07-11T06:00:00.000Z"),
      transactionId,
      update,
    }

    try {
      await expect(useCase.saveTransaction(input)).resolves.toEqual({
        contentRevision: 1,
        kind: "accepted",
        stateVersion: 1,
        transactionId,
      })
      await expect(
        useCase.readSync({ afterStateVersion: 0, documentId })
      ).resolves.toEqual({
        fromStateVersion: 0,
        kind: "updates",
        stateVersion: 1,
        updates: [update],
      })
      await expect(
        useCase.readSync({
          afterStateVersion: 1,
          documentId,
          mode: "snapshot",
        })
      ).resolves.toMatchObject({ kind: "snapshot", stateVersion: 1 })
      fixture.client.sqlite.exec(
        "DELETE FROM admin_resource_collaboration_updates"
      )
      const fallback = await useCase.readSync({
        afterStateVersion: 0,
        documentId,
      })
      expect(fallback).toMatchObject({ kind: "snapshot", stateVersion: 1 })
      if (fallback.kind === "snapshot") {
        expect(projectResourceDocumentSnapshot(fallback.snapshot)).toEqual({
          markdown: "변경된 **본문**",
          status: "valid",
        })
      }
      await expect(
        useCase.saveTransaction({ ...input, update: Uint8Array.of(0) })
      ).resolves.toEqual({
        contentRevision: 1,
        kind: "already-accepted",
        stateVersion: 1,
        transactionId,
      })
    } finally {
      fixture.client.close()
    }
  })
})

function createFixture(snapshot: Uint8Array) {
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
  client.sqlite
    .query(
      `INSERT INTO admin_resource_collaboration (
        document_id, yjs_state, state_version, projected_at
      ) VALUES ('document-1', ?1, 0, 1)`
    )
    .run(Buffer.from(snapshot))

  return {
    client,
    repository: createDrizzleResourceDocumentSyncRepository(client.db),
  }
}

function createUpdate(snapshot: Uint8Array, markdown: string): Uint8Array {
  const document = new Doc()
  const collaboration = createHeadlessResourceDocumentCollaboration({
    document,
    id: "resource-document-sync-test",
  })
  applyUpdate(document, snapshot)
  readResourceDocumentMarkdown(collaboration.editor)
  const updates: Uint8Array[] = []
  document.on("update", (update) => updates.push(update))
  const replaced = replaceResourceDocumentMarkdown(
    collaboration.editor,
    markdown
  )
  if (replaced.status !== "valid") throw new Error("fixture 변경 실패")

  collaboration.disconnect()
  document.destroy()
  return mergeUpdates(updates)
}
