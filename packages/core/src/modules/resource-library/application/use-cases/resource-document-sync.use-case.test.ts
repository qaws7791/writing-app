import { describe, expect, it } from "vitest"
import { applyUpdate, Doc, mergeUpdates } from "yjs"

import { createResourceDocumentSyncUseCase } from "@workspace/core/modules/resource-library/application/use-cases/resource-document-sync.use-case"
import { toResourceDocumentTransactionId } from "@workspace/core/modules/resource-library/domain/resource-document-sync"
import { toResourceDocumentId } from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { createDrizzleResourceDocumentSyncRepository } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-document-sync-drizzle.repository"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import {
  applyResourceDocumentUpdate,
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

  it("같은 snapshot에서 동시에 편집한 두 클라이언트와 durable Markdown이 수렴한다", async () => {
    const initial = createResourceDocumentSnapshot("초기 본문")
    if (initial.status !== "valid") throw new Error("초기 snapshot 생성 실패")

    const fixture = createFixture(initial.snapshot)
    const useCase = createResourceDocumentSyncUseCase(fixture.repository)
    const firstUpdate = createUpdate(initial.snapshot, "첫 번째 관리자 본문")
    const secondUpdate = createUpdate(initial.snapshot, "두 번째 관리자 본문")

    try {
      const [firstResult, secondResult] = await Promise.all([
        useCase.saveTransaction({
          actorId: "admin-1",
          documentId,
          knownStateVersion: 0,
          now: new Date("2026-07-11T06:00:00.000Z"),
          transactionId: toResourceDocumentTransactionId("transaction-1"),
          update: firstUpdate,
        }),
        useCase.saveTransaction({
          actorId: "admin-2",
          documentId,
          knownStateVersion: 0,
          now: new Date("2026-07-11T06:00:01.000Z"),
          transactionId: toResourceDocumentTransactionId("transaction-2"),
          update: secondUpdate,
        }),
      ])
      expect([firstResult, secondResult]).toMatchObject([
        { kind: "accepted", stateVersion: 1 },
        { kind: "accepted", stateVersion: 2 },
      ])

      const sync = await useCase.readSync({
        afterStateVersion: 0,
        documentId,
      })
      if (sync.kind !== "updates") {
        throw new Error("두 클라이언트의 증분 update를 조회하지 못했습니다.")
      }
      const durable = await useCase.readSync({
        afterStateVersion: 0,
        documentId,
        mode: "snapshot",
      })
      if (durable.kind !== "snapshot") {
        throw new Error("durable snapshot을 조회하지 못했습니다.")
      }
      const durableProjection = projectResourceDocumentSnapshot(
        durable.snapshot
      )
      if (durableProjection.status !== "valid") {
        throw new Error("durable snapshot 투영에 실패했습니다.")
      }

      expect(
        applyUpdates(initial.snapshot, [firstUpdate, ...sync.updates])
      ).toBe(durableProjection.markdown)
      expect(
        applyUpdates(initial.snapshot, [secondUpdate, ...sync.updates])
      ).toBe(durableProjection.markdown)
    } finally {
      fixture.client.close()
    }
  })

  it("서버 재시작 뒤 SQLite version에서 sync와 transaction 저장을 이어간다", async () => {
    const initial = createResourceDocumentSnapshot("초기 본문")
    if (initial.status !== "valid") throw new Error("초기 snapshot 생성 실패")

    const fixture = createFixture(initial.snapshot)
    const firstServer = createResourceDocumentSyncUseCase(fixture.repository)
    const firstUpdate = createUpdate(initial.snapshot, "재시작 전 본문")

    try {
      await expect(
        firstServer.saveTransaction({
          actorId: "admin-1",
          documentId,
          knownStateVersion: 0,
          now: new Date("2026-07-11T06:00:00.000Z"),
          transactionId: toResourceDocumentTransactionId("transaction-1"),
          update: firstUpdate,
        })
      ).resolves.toMatchObject({ kind: "accepted", stateVersion: 1 })

      const restartedServer = createResourceDocumentSyncUseCase(
        fixture.repository
      )
      await expect(
        restartedServer.readSync({ afterStateVersion: 0, documentId })
      ).resolves.toMatchObject({
        fromStateVersion: 0,
        kind: "updates",
        stateVersion: 1,
        updates: [firstUpdate],
      })

      const firstApplied = applyResourceDocumentUpdate(
        initial.snapshot,
        firstUpdate
      )
      if (firstApplied.status !== "valid") {
        throw new Error("재시작 전 update 적용에 실패했습니다.")
      }
      const secondUpdate = createUpdate(firstApplied.snapshot, "재시작 후 본문")
      await expect(
        restartedServer.saveTransaction({
          actorId: "admin-2",
          documentId,
          knownStateVersion: 1,
          now: new Date("2026-07-11T06:01:00.000Z"),
          transactionId: toResourceDocumentTransactionId("transaction-2"),
          update: secondUpdate,
        })
      ).resolves.toMatchObject({ kind: "accepted", stateVersion: 2 })

      const durable = await restartedServer.readSync({
        afterStateVersion: 0,
        documentId,
        mode: "snapshot",
      })
      if (durable.kind !== "snapshot") {
        throw new Error("재시작 후 durable snapshot을 조회하지 못했습니다.")
      }
      expect(projectResourceDocumentSnapshot(durable.snapshot)).toEqual({
        markdown: "재시작 후 본문",
        status: "valid",
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

function applyUpdates(
  initialSnapshot: Uint8Array,
  updates: readonly Uint8Array[]
): string {
  let snapshot = initialSnapshot
  let markdown = ""

  for (const update of updates) {
    const applied = applyResourceDocumentUpdate(snapshot, update)
    if (applied.status !== "valid") {
      throw new Error("클라이언트 update 적용에 실패했습니다.")
    }
    snapshot = applied.snapshot
    markdown = applied.markdown
  }

  return markdown
}
