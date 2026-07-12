import { describe, expect, it } from "vitest"

import { createDrizzleResourceSearchRepository } from "#core/modules/resource-library/infrastructure/persistence/resource-search-drizzle.repository"
import { createDrizzleResourceTreeRepository } from "#core/modules/resource-library/infrastructure/persistence/resource-tree-drizzle.repository"
import { toResourceFolderId } from "#core/modules/resource-library/domain/resource-tree-node"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

const folderCount = 100
const documentsPerFolder = 99
const expectedNodeCount = folderCount * (documentsPerFolder + 1)
const maximumOperationMilliseconds = 2_000

describe("자료실 10,000개 node 성능 기준", () => {
  it("루트·펼친 폴더를 지연 조회하고 전체 FTS에서 목표 문서를 찾는다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)
      insertAdminUser(client.sqlite)
      insertPerformanceFixture(client.sqlite)

      const tree = createDrizzleResourceTreeRepository(client.db)
      const search = createDrizzleResourceSearchRepository(client.db)
      const rootRead = await measure(() =>
        tree.readChildren({ parentId: null, scope: "active" })
      )
      const childRead = await measure(() =>
        tree.readChildren({
          parentId: toResourceFolderId("folder-99"),
          scope: "active",
        })
      )
      const fullTextSearch = await measure(() =>
        search.search({ limit: 20, query: "성능목표", scope: "active" })
      )

      expect(readNodeCount(client.sqlite)).toBe(expectedNodeCount)
      expect(rootRead.value).toHaveLength(folderCount)
      expect(childRead.value).toHaveLength(documentsPerFolder)
      expect(fullTextSearch.value).toEqual([
        expect.objectContaining({
          id: "document-99-98",
          kind: "document",
          path: [{ id: "folder-99", name: "성능 폴더 99" }],
        }),
      ])
      expect(rootRead.durationMilliseconds).toBeLessThan(
        maximumOperationMilliseconds
      )
      expect(childRead.durationMilliseconds).toBeLessThan(
        maximumOperationMilliseconds
      )
      expect(fullTextSearch.durationMilliseconds).toBeLessThan(
        maximumOperationMilliseconds
      )
    } finally {
      client.close()
    }
  }, 30_000)
})

async function measure<TValue>(operation: () => Promise<TValue>): Promise<{
  readonly durationMilliseconds: number
  readonly value: TValue
}> {
  const startedAt = performance.now()
  const value = await operation()

  return {
    durationMilliseconds: performance.now() - startedAt,
    value,
  }
}

function insertPerformanceFixture(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  const insertNode = sqlite.query<
    void,
    [
      id: string,
      kind: "document" | "folder",
      parentId: string | null,
      name: string,
      normalizedName: string,
      sortOrder: number,
    ]
  >(`
    INSERT INTO admin_resource_nodes (
      id, kind, parent_id, name, normalized_name, sort_order, status,
      trash_root_id, created_by, updated_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'active', NULL, 'admin-1', 'admin-1', 1, 1)
  `)
  const insertDocument = sqlite.query<void, [nodeId: string]>(`
    INSERT INTO admin_resource_documents (
      node_id, content_markdown, content_revision
    ) VALUES (?, '', 0)
  `)
  const insertSearch = sqlite.query<
    void,
    [
      nodeId: string,
      kind: "document" | "folder",
      name: string,
      bodyText: string,
    ]
  >(`
    INSERT INTO admin_resource_search (node_id, kind, name, body_text)
    VALUES (?, ?, ?, ?)
  `)

  sqlite.transaction(() => {
    for (let folderIndex = 0; folderIndex < folderCount; folderIndex += 1) {
      const folderId = `folder-${folderIndex}`
      const folderName = `성능 폴더 ${folderIndex}`

      insertNode.run(
        folderId,
        "folder",
        null,
        folderName,
        folderName,
        folderIndex
      )
      insertSearch.run(folderId, "folder", folderName, "")

      for (
        let documentIndex = 0;
        documentIndex < documentsPerFolder;
        documentIndex += 1
      ) {
        const documentId = `document-${folderIndex}-${documentIndex}`
        const documentName = `성능 문서 ${documentIndex}`
        const bodyText =
          folderIndex === folderCount - 1 &&
          documentIndex === documentsPerFolder - 1
            ? "유일한 성능목표 본문"
            : "일반 자료 본문"

        insertNode.run(
          documentId,
          "document",
          folderId,
          documentName,
          documentName,
          documentIndex
        )
        insertDocument.run(documentId)
        insertSearch.run(documentId, "document", documentName, bodyText)
      }
    }
  })()
}

function insertAdminUser(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    INSERT INTO admin_user (
      id, name, email, email_verified, role, created_at, updated_at
    ) VALUES (
      'admin-1', '관리자', 'admin@example.com', 1, 'operator', 1, 1
    )
  `)
}

function readNodeCount(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): number {
  return (
    sqlite
      .query<{ readonly count: number }, []>(
        "SELECT COUNT(*) AS count FROM admin_resource_nodes"
      )
      .get()?.count ?? 0
  )
}
