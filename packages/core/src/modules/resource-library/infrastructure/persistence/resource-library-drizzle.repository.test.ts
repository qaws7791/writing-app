import { describe, expect, it } from "vitest"

import { createAdminApiCore } from "#core/composition/admin-bootstrap"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { adminAuthUsers } from "@workspace/db/schema"

describe("관리자 자료실 SQLite repository", () => {
  it("3단계 트리, 조건부 저장, FTS, 재귀 휴지통과 자산 삭제 키를 한 모델로 처리한다", async () => {
    const client = createInMemoryWritingAppDatabase()
    const now = new Date("2026-07-16T10:00:00.000Z")

    try {
      runBaselineMigration(client.sqlite)
      client.db
        .insert(adminAuthUsers)
        .values({
          createdAt: now,
          email: "admin@example.com",
          emailVerified: true,
          id: "admin-1",
          name: "관리자",
          role: "owner",
          updatedAt: now,
        })
        .run()
      const resources = createAdminApiCore({ database: client.db }).services
        .resourceLibrary
      const command = { actorId: "admin-1", now }

      const root = await resources.tree.createFolder({
        ...command,
        parentId: null,
      })
      expect(root.kind).toBe("ok")
      if (root.kind !== "ok") return
      const child = await resources.tree.createFolder({
        ...command,
        parentId: root.value.node.id,
      })
      expect(child.kind).toBe("ok")
      if (child.kind !== "ok") return
      const grandchild = await resources.tree.createFolder({
        ...command,
        parentId: child.value.node.id,
      })
      expect(grandchild.kind).toBe("ok")
      if (grandchild.kind !== "ok") return

      await expect(
        resources.tree.createFolder({
          ...command,
          parentId: grandchild.value.node.id,
        })
      ).resolves.toEqual({ kind: "depth-limit" })

      const createdDocument = await resources.tree.createDocument({
        ...command,
        parentId: grandchild.value.node.id,
      })
      expect(createdDocument.kind).toBe("ok")
      if (createdDocument.kind !== "ok") return
      const documentId = createdDocument.value.node.id

      const saved = await resources.documents.saveDocument({
        ...command,
        contentMarkdown: "검색어가 포함된 본문입니다.",
        documentId,
        expectedVersion: 0,
        name: "운영 기준",
      })
      expect(saved).toMatchObject({
        document: { name: "운영 기준", version: 1 },
        kind: "ok",
      })
      await expect(
        resources.documents.saveDocument({
          ...command,
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
        kind: "conflict",
      })
      await expect(
        resources.search.search({ limit: 10, query: "검색어" })
      ).resolves.toMatchObject({
        items: [{ id: documentId, name: "운영 기준", version: 1 }],
      })

      const assetId = resources.assets.createAssetId()
      await expect(
        resources.assets.registerImage({
          assetId,
          byteSize: 128,
          contentType: "image/png",
          createdAt: now,
          documentId,
          objectKey: "resource-library/document/image.png",
        })
      ).resolves.toEqual({ kind: "ok" })

      await expect(
        resources.tree.trashNode({ ...command, nodeId: root.value.node.id })
      ).resolves.toMatchObject({
        kind: "ok",
        value: { documentCount: 1, folderCount: 3 },
      })
      await expect(
        resources.tree.getTree({ scope: "active" })
      ).resolves.toEqual({
        nodes: [],
      })
      expect(
        (await resources.tree.getTree({ scope: "trash" })).nodes
      ).toHaveLength(4)

      await expect(
        resources.tree.deleteNodePermanently({
          ...command,
          nodeId: root.value.node.id,
        })
      ).resolves.toMatchObject({
        kind: "ok",
        value: {
          documentCount: 1,
          folderCount: 3,
          r2ObjectKeys: ["resource-library/document/image.png"],
        },
      })
    } finally {
      client.close()
    }
  })
})
