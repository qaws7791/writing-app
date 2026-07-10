import { describe, expect, it } from "vitest"

import { createDrizzleResourceTreeRepository } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-tree-drizzle.repository"
import {
  toResourceAuditEventId,
  toResourceDocumentId,
  toResourceFolderId,
} from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

const now = new Date("2026-07-10T00:00:00.000Z")

describe("자료 트리 Drizzle repository", () => {
  it("생성 이름 접미사와 문서 본문, revision, 감사 이벤트를 한 트랜잭션으로 저장한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      const firstFolder = await fixture.repository.createNode({
        ...commandContext(0, "audit-create-1"),
        kind: "folder",
        nodeId: toResourceFolderId("folder-1"),
        parentId: null,
        preferredName: " 새 폴더 ",
      })
      const secondFolder = await fixture.repository.createNode({
        ...commandContext(1, "audit-create-2"),
        kind: "folder",
        nodeId: toResourceFolderId("folder-2"),
        parentId: null,
        preferredName: "새 폴더",
      })
      const document = await fixture.repository.createNode({
        ...commandContext(2, "audit-create-3"),
        kind: "document",
        nodeId: toResourceDocumentId("document-1"),
        parentId: toResourceFolderId("folder-1"),
        preferredName: "제목 없음",
      })

      expect(firstFolder).toMatchObject({
        kind: "ok",
        value: { node: { name: "새 폴더", sortOrder: 0 }, revision: 1 },
      })
      expect(secondFolder).toMatchObject({
        kind: "ok",
        value: { node: { name: "새 폴더 (2)", sortOrder: 1 }, revision: 2 },
      })
      expect(document).toMatchObject({
        kind: "ok",
        value: { node: { name: "제목 없음", sortOrder: 0 }, revision: 3 },
      })
      expect(await fixture.repository.readRevision()).toBe(3)
      expect(
        fixture.client.sqlite
          .query<
            {
              readonly content_markdown: string
              readonly content_revision: number
            },
            []
          >(
            "SELECT content_markdown, content_revision FROM admin_resource_documents"
          )
          .get()
      ).toEqual({ content_markdown: "", content_revision: 0 })
      expect(readAuditEvents(fixture.client.sqlite)).toEqual([
        { event_type: "create", node_id: "folder-1" },
        { event_type: "create", node_id: "folder-2" },
        { event_type: "create", node_id: "document-1" },
      ])
      expect(
        fixture.client.sqlite
          .query<
            {
              readonly body_text: string
              readonly name: string
              readonly node_id: string
            },
            []
          >(
            "SELECT node_id, name, body_text FROM admin_resource_search ORDER BY rowid"
          )
          .all()
      ).toEqual([
        { body_text: "", name: "새 폴더", node_id: "folder-1" },
        { body_text: "", name: "새 폴더 (2)", node_id: "folder-2" },
        { body_text: "", name: "제목 없음", node_id: "document-1" },
      ])

      await expect(
        fixture.repository.createNode({
          ...commandContext(0, "audit-stale"),
          kind: "folder",
          nodeId: toResourceFolderId("folder-stale"),
          parentId: null,
          preferredName: "생성되면 안 됨",
        })
      ).resolves.toEqual({ actualRevision: 3, kind: "stale-revision" })
      expect(await fixture.repository.readRevision()).toBe(3)
      expect(readNodeIds(fixture.client.sqlite)).not.toContain("folder-stale")
      expect(readAuditEvents(fixture.client.sqlite)).toHaveLength(3)
    } finally {
      fixture.client.close()
    }
  })

  it("이름 변경 충돌과 순환 이동을 거부하고 부모 이동과 재정렬을 연속 번호로 저장한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await createNode(fixture, 0, "folder-a", "folder", null, "A")
      await createNode(fixture, 1, "folder-b", "folder", null, "B")
      await createNode(fixture, 2, "folder-child", "folder", "folder-a", "하위")
      await createNode(
        fixture,
        3,
        "document-a",
        "document",
        "folder-a",
        "문서 A"
      )
      await createNode(
        fixture,
        4,
        "document-b",
        "document",
        "folder-a",
        "문서 B"
      )

      await expect(
        fixture.repository.renameNode({
          ...commandContext(5, "audit-rename-conflict"),
          name: "b",
          nodeId: toResourceFolderId("folder-a"),
        })
      ).resolves.toEqual({ kind: "name-conflict" })
      await expect(
        fixture.repository.moveNode({
          ...commandContext(5, "audit-cycle"),
          destinationIndex: 0,
          destinationParentId: toResourceFolderId("folder-child"),
          nodeId: toResourceFolderId("folder-a"),
        })
      ).resolves.toEqual({ kind: "cycle" })

      await expect(
        fixture.repository.moveNode({
          ...commandContext(5, "audit-reorder"),
          destinationIndex: 0,
          destinationParentId: toResourceFolderId("folder-a"),
          nodeId: toResourceDocumentId("document-b"),
        })
      ).resolves.toMatchObject({ kind: "ok", value: { revision: 6 } })
      expect(
        (await fixture.repository.readChildren(toParent("folder-a"))).map(
          ({ node: { id, sortOrder } }) => ({ id, sortOrder })
        )
      ).toEqual([
        { id: "document-b", sortOrder: 0 },
        { id: "folder-child", sortOrder: 1 },
        { id: "document-a", sortOrder: 2 },
      ])

      await expect(
        fixture.repository.moveNode({
          ...commandContext(6, "audit-move"),
          destinationIndex: 1,
          destinationParentId: toResourceFolderId("folder-b"),
          nodeId: toResourceDocumentId("document-a"),
        })
      ).resolves.toEqual({ kind: "invalid-position" })
      await expect(
        fixture.repository.moveNode({
          ...commandContext(6, "audit-move"),
          destinationIndex: 0,
          destinationParentId: toResourceFolderId("folder-b"),
          nodeId: toResourceDocumentId("document-a"),
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: { affectedParentIds: ["folder-a", "folder-b"], revision: 7 },
      })
      expect(
        (await fixture.repository.readChildren(toParent("folder-a"))).map(
          ({ node: { id, sortOrder } }) => ({ id, sortOrder })
        )
      ).toEqual([
        { id: "document-b", sortOrder: 0 },
        { id: "folder-child", sortOrder: 1 },
      ])
      expect(
        (await fixture.repository.readChildren(toParent("folder-b"))).map(
          ({ node: { id, sortOrder } }) => ({ id, sortOrder })
        )
      ).toEqual([{ id: "document-a", sortOrder: 0 }])
      expect(readAuditEvents(fixture.client.sqlite).slice(-2)).toEqual([
        { event_type: "reorder", node_id: "document-b" },
        { event_type: "move", node_id: "document-a" },
      ])
    } finally {
      fixture.client.close()
    }
  })

  it("폴더 전체를 같은 trash root로 이동하고 이름 충돌을 보정해 원래 위치에 복원한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await createNode(fixture, 0, "before", "folder", null, "앞")
      await createNode(fixture, 1, "root", "folder", null, "기획")
      await createNode(fixture, 2, "after", "document", null, "뒤")
      await createNode(fixture, 3, "child", "folder", "root", "하위")
      await createNode(fixture, 4, "leaf", "document", "child", "문서")

      await expect(
        fixture.repository.trashNode({
          ...commandContext(5, "audit-trash"),
          nodeId: toResourceFolderId("root"),
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: { documentCount: 1, folderCount: 2, revision: 6 },
      })
      expect(
        (await fixture.repository.readSubtree(toResourceFolderId("root"))).map(
          ({ id, status, trashRootId }) => ({ id, status, trashRootId })
        )
      ).toEqual([
        { id: "root", status: "archived", trashRootId: "root" },
        { id: "child", status: "archived", trashRootId: "root" },
        { id: "leaf", status: "archived", trashRootId: "root" },
      ])
      await expect(
        fixture.repository.readChildren({ parentId: null, scope: "trash" })
      ).resolves.toEqual([
        expect.objectContaining({
          hasChildren: true,
          node: expect.objectContaining({ id: "root", status: "archived" }),
        }),
      ])
      expect(
        (await fixture.repository.readChildren(toParent(null))).map(
          ({ node: { id, sortOrder } }) => ({ id, sortOrder })
        )
      ).toEqual([
        { id: "before", sortOrder: 0 },
        { id: "after", sortOrder: 1 },
      ])

      await createNode(fixture, 6, "replacement", "folder", null, "기획")
      await expect(
        fixture.repository.restoreNode({
          ...commandContext(7, "audit-restore"),
          nodeId: toResourceFolderId("root"),
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: {
          documentCount: 1,
          folderCount: 2,
          node: { name: "기획 (2)" },
          revision: 8,
        },
      })
      expect(
        (await fixture.repository.readChildren(toParent(null))).map(
          ({ node: { id, name, sortOrder } }) => ({ id, name, sortOrder })
        )
      ).toEqual([
        { id: "before", name: "앞", sortOrder: 0 },
        { id: "root", name: "기획 (2)", sortOrder: 1 },
        { id: "after", name: "뒤", sortOrder: 2 },
        { id: "replacement", name: "기획", sortOrder: 3 },
      ])
      expect(
        (await fixture.repository.readSubtree(toResourceFolderId("root"))).map(
          ({ id, status, trashRootId }) => ({ id, status, trashRootId })
        )
      ).toEqual([
        { id: "root", status: "active", trashRootId: null },
        { id: "child", status: "active", trashRootId: null },
        { id: "leaf", status: "active", trashRootId: null },
      ])
    } finally {
      fixture.client.close()
    }
  })

  it("애플리케이션 깊이 제한 없이 재귀 하위 트리를 처리한다", async () => {
    const fixture = createRepositoryFixture()
    const depth = 1_100

    try {
      insertDeepFolderTree(fixture.client.sqlite, depth)

      await expect(
        fixture.repository.trashNode({
          ...commandContext(0, "audit-deep-trash"),
          nodeId: toResourceFolderId("deep-0"),
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: { documentCount: 0, folderCount: depth, revision: 1 },
      })
      expect(
        await fixture.repository.readSubtree(toResourceFolderId("deep-0"))
      ).toHaveLength(depth)
      await expect(
        fixture.repository.restoreNode({
          ...commandContext(1, "audit-deep-restore"),
          nodeId: toResourceFolderId("deep-0"),
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: { documentCount: 0, folderCount: depth, revision: 2 },
      })
    } finally {
      fixture.client.close()
    }
  })

  it("감사 이벤트 저장 실패 시 node 변경과 revision을 함께 롤백한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await fixture.repository.createNode({
        ...commandContext(0, "audit-duplicate"),
        kind: "folder",
        nodeId: toResourceFolderId("folder-rollback"),
        parentId: null,
        preferredName: "변경 전",
      })

      await expect(
        fixture.repository.renameNode({
          ...commandContext(1, "audit-duplicate"),
          name: "변경 후",
          nodeId: toResourceFolderId("folder-rollback"),
        })
      ).rejects.toThrow("UNIQUE constraint failed")
      expect(await fixture.repository.readRevision()).toBe(1)
      expect(await fixture.repository.readChildren(toParent(null))).toEqual([
        expect.objectContaining({
          node: expect.objectContaining({ name: "변경 전" }),
        }),
      ])
      expect(readAuditEvents(fixture.client.sqlite)).toHaveLength(1)
    } finally {
      fixture.client.close()
    }
  })
})

function commandContext(revision: number, auditEventId: string) {
  return {
    actorId: "admin-1",
    auditEventId: toResourceAuditEventId(auditEventId),
    expectedRevision: revision,
    now,
  }
}

function createRepositoryFixture() {
  const client = createInMemoryWritingAppDatabase()
  runBaselineMigration(client.sqlite)
  insertAdminUser(client.sqlite)

  return {
    client,
    repository: createDrizzleResourceTreeRepository(client.db),
  }
}

async function createNode(
  fixture: ReturnType<typeof createRepositoryFixture>,
  revision: number,
  id: string,
  kind: "document" | "folder",
  parentId: string | null,
  preferredName: string
): Promise<void> {
  const input = {
    ...commandContext(revision, `audit-create-${id}`),
    parentId: parentId === null ? null : toResourceFolderId(parentId),
    preferredName,
  }
  const result =
    kind === "folder"
      ? await fixture.repository.createNode({
          ...input,
          kind,
          nodeId: toResourceFolderId(id),
        })
      : await fixture.repository.createNode({
          ...input,
          kind,
          nodeId: toResourceDocumentId(id),
        })

  expect(result).toMatchObject({
    kind: "ok",
    value: { revision: revision + 1 },
  })
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

function insertDeepFolderTree(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  depth: number
): void {
  const insert = sqlite.query<
    void,
    [id: string, parentId: string | null, name: string, normalizedName: string]
  >(`
    INSERT INTO admin_resource_nodes (
      id, kind, parent_id, name, normalized_name, sort_order, status,
      trash_root_id, created_by, updated_by, created_at, updated_at
    ) VALUES (?, 'folder', ?, ?, ?, 0, 'active', NULL, 'admin-1', 'admin-1', 1, 1)
  `)

  sqlite.transaction(() => {
    for (let index = 0; index < depth; index += 1) {
      const id = `deep-${index}`
      insert.run(id, index === 0 ? null : `deep-${index - 1}`, id, id)
    }
  })()
}

function readAuditEvents(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
) {
  return sqlite
    .query<{ readonly event_type: string; readonly node_id: string }, []>(
      "SELECT event_type, node_id FROM admin_resource_audit_events ORDER BY created_at, rowid"
    )
    .all()
}

function readNodeIds(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): readonly string[] {
  return sqlite
    .query<{ readonly id: string }, []>("SELECT id FROM admin_resource_nodes")
    .all()
    .map(({ id }) => id)
}

function toParent(parentId: string | null): {
  readonly parentId: ReturnType<typeof toResourceFolderId> | null
  readonly scope: "active"
} {
  return {
    parentId: parentId === null ? null : toResourceFolderId(parentId),
    scope: "active",
  }
}
