import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { createWritingAppDatabase } from "@workspace/db/client"
import { runBaselineTestMigration } from "@workspace/db/test-support/application-migration"

import { createDrizzleResourceAssetRepository } from "#resource-library/infrastructure/persistence/resource-asset-drizzle-repository"
import { createDrizzleResourceDocumentRepository } from "#resource-library/infrastructure/persistence/resource-document-drizzle-repository"
import { createDrizzleResourceSearchRepository } from "#resource-library/infrastructure/persistence/resource-search-drizzle-repository"
import { createDrizzleResourceTreeRepository } from "#resource-library/infrastructure/persistence/resource-tree-drizzle-repository"
import { runResourceLibrarySchemaMigration } from "#resource-library/infrastructure/persistence/schema-migration"
import {
  readResourceAssetId,
  readResourceDocumentId,
  readResourceFolderId,
} from "#resource-library/domain/resource-tree-node"

const now = new Date("2026-07-18T00:00:00.000Z")
const actorId = adminIdSchema.parse("admin-1")

describe("resource-library temporary SQLite repositories", () => {
  it("depth·cycle·stale conflict·FTS·trash와 delete-pending 완료를 한 모델로 처리한다", async () => {
    await withTemporaryResourceDatabase(async ({ database, sqlite }) => {
      const tree = createDrizzleResourceTreeRepository(database)
      const documents = createDrizzleResourceDocumentRepository(database)
      const search = createDrizzleResourceSearchRepository(database)
      const assets = createDrizzleResourceAssetRepository(database)
      const command = { actorId, now }
      const rootId = readResourceFolderId("folder-root")
      const childId = readResourceFolderId("folder-child")
      const grandchildId = readResourceFolderId("folder-grandchild")
      const documentId = readResourceDocumentId("document-1")

      await expect(
        tree.createNode({
          ...command,
          kind: "folder",
          nodeId: rootId,
          parentId: null,
          preferredName: "운영 자료",
        })
      ).resolves.toMatchObject({ kind: "ok" })
      await expect(
        tree.createNode({
          ...command,
          kind: "folder",
          nodeId: childId,
          parentId: rootId,
          preferredName: "문장",
        })
      ).resolves.toMatchObject({ kind: "ok" })
      await expect(
        tree.createNode({
          ...command,
          kind: "folder",
          nodeId: grandchildId,
          parentId: childId,
          preferredName: "예시",
        })
      ).resolves.toMatchObject({ kind: "ok" })
      await expect(
        tree.createNode({
          ...command,
          kind: "folder",
          nodeId: readResourceFolderId("folder-too-deep"),
          parentId: grandchildId,
          preferredName: "거부",
        })
      ).resolves.toEqual({
        kind: "resource-validation",
        reason: "depth-limit",
      })
      await expect(
        tree.moveNode({
          ...command,
          destinationParentId: childId,
          nodeId: rootId,
        })
      ).resolves.toEqual({
        kind: "resource-conflict",
        reason: "move-cycle",
      })

      await expect(
        tree.createNode({
          ...command,
          kind: "document",
          nodeId: documentId,
          parentId: grandchildId,
          preferredName: "제목 없음",
        })
      ).resolves.toMatchObject({ kind: "ok" })
      await expect(
        documents.saveDocument({
          ...command,
          bodyText: "검색어가 포함된 본문입니다.",
          contentMarkdown: "검색어가 포함된 본문입니다.",
          documentId,
          expectedVersion: 0,
          name: "운영 기준",
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: { name: "운영 기준", version: 1 },
      })
      await expect(
        documents.saveDocument({
          ...command,
          bodyText: "뒤늦은 저장",
          contentMarkdown: "뒤늦은 저장",
          documentId,
          expectedVersion: 0,
          name: "충돌 저장",
        })
      ).resolves.toMatchObject({
        document: {
          contentMarkdown: "검색어가 포함된 본문입니다.",
          version: 1,
        },
        kind: "stale-version",
      })
      await expect(
        search.search({ limit: 10, query: "검색어" })
      ).resolves.toEqual([
        expect.objectContaining({
          id: documentId,
          name: "운영 기준",
          version: 1,
        }),
      ])

      await expect(
        assets.createAsset({
          altText: "운영 화면",
          byteSize: 8,
          contentType: "image/png",
          createdAt: now,
          documentId,
          id: readResourceAssetId("asset-1"),
          objectKey: "resource-library/document-1/asset-1.png",
          status: "active",
        })
      ).resolves.toEqual({ kind: "ok" })
      await expect(
        tree.trashNode({ ...command, nodeId: rootId })
      ).resolves.toEqual({
        kind: "ok",
        value: { documentCount: 1, folderCount: 3 },
      })

      const prepared = await tree.preparePermanentDelete({
        ...command,
        nodeId: rootId,
      })
      expect(prepared).toMatchObject({
        kind: "ok",
        value: {
          assets: [
            {
              deleteRootId: rootId,
              objectKey: "resource-library/document-1/asset-1.png",
            },
          ],
          documentCount: 1,
          folderCount: 3,
        },
      })
      expect(
        sqlite
          .query<{ readonly status: string }, []>(
            "SELECT status FROM admin_resource_assets WHERE id = 'asset-1'"
          )
          .get()
      ).toEqual({ status: "delete-pending" })

      await expect(tree.completePermanentDelete(rootId)).resolves.toEqual({
        kind: "ok",
        value: undefined,
      })
      expect(
        sqlite
          .query<{ readonly value: number }, []>(
            "SELECT COUNT(*) AS value FROM admin_resource_nodes"
          )
          .get()
      ).toEqual({ value: 0 })
    })
  })

  it("검색 색인 갱신 실패 시 제목·본문·version transaction을 rollback한다", async () => {
    await withTemporaryResourceDatabase(async ({ database, sqlite }) => {
      const tree = createDrizzleResourceTreeRepository(database)
      const documents = createDrizzleResourceDocumentRepository(database)
      const documentId = readResourceDocumentId("document-rollback")
      await tree.createNode({
        actorId,
        kind: "document",
        nodeId: documentId,
        now,
        parentId: null,
        preferredName: "원래 제목",
      })
      sqlite.exec("DROP TABLE admin_resource_search")

      await expect(
        documents.saveDocument({
          actorId,
          bodyText: "변경 본문",
          contentMarkdown: "변경 본문",
          documentId,
          expectedVersion: 0,
          name: "변경 제목",
          now,
        })
      ).rejects.toThrow()
      expect(
        sqlite
          .query<
            {
              readonly content: string
              readonly name: string
              readonly version: number
            },
            []
          >(`
            SELECT node.name, document.content_markdown AS content, document.version
            FROM admin_resource_nodes AS node
            INNER JOIN admin_resource_documents AS document
              ON document.node_id = node.id
            WHERE node.id = 'document-rollback'
          `)
          .get()
      ).toEqual({ content: "", name: "원래 제목", version: 0 })
    })
  })

  it("reconciliation 조회 DB 예외를 typed persistence error로 변환한다", async () => {
    await withTemporaryResourceDatabase(async ({ database, sqlite }) => {
      sqlite.exec("DROP TABLE admin_resource_assets")

      const result =
        await createDrizzleResourceTreeRepository(
          database
        ).readPendingAssetDeletions(10)

      expect(result._unsafeUnwrapErr()).toEqual({
        kind: "resource-reconciliation-persistence-failed",
        operation: "read-pending-asset-deletions",
      })
    })
  })
})

async function withTemporaryResourceDatabase(
  run: (input: {
    readonly database: ReturnType<typeof createWritingAppDatabase>["db"]
    readonly sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"]
  }) => Promise<void>
): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), "writing-app-resource-library-"))
  const client = createWritingAppDatabase(join(directory, "resource.sqlite"))
  try {
    runBaselineTestMigration(client.sqlite)
    insertAdmin(client.sqlite)
    runResourceLibrarySchemaMigration(client.sqlite)
    await run({ database: client.db, sqlite: client.sqlite })
  } finally {
    client.close()
    rmSync(directory, { force: true, recursive: true })
  }
}

function insertAdmin(
  sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"]
): void {
  sqlite
    .query<unknown, [string, string, string, number, number]>(`
      INSERT INTO admin_user (
        id, name, email, email_verified, role, created_at, updated_at
      ) VALUES (?, ?, ?, 1, 'owner', ?, ?)
    `)
    .run("admin-1", "관리자", "admin@example.com", now.getTime(), now.getTime())
}
