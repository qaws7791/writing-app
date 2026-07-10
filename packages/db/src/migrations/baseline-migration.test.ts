import { describe, expect, it } from "vitest"

import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

describe("기준 migration", () => {
  it("최종 자료실 트리·문서·협업·감사·검색 schema를 한 번에 만든다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)

      expect(
        readColumnNames(client.sqlite, "admin_resource_documents")
      ).toEqual(["node_id", "content_markdown", "content_revision"])
      expect(readObjectNames(client.sqlite)).toEqual(
        expect.arrayContaining([
          "admin_resource_audit_events",
          "admin_resource_collaboration",
          "admin_resource_documents",
          "admin_resource_nodes",
          "admin_resource_search",
          "admin_resource_tree_state",
        ])
      )
      expect(
        client.sqlite
          .query<{ readonly revision: number }, []>(
            "SELECT revision FROM admin_resource_tree_state WHERE singleton_id = 1"
          )
          .get()
      ).toEqual({ revision: 0 })
      expect(
        client.sqlite
          .query<{ readonly integrity_check: string }, []>(
            "PRAGMA integrity_check"
          )
          .get()
      ).toEqual({ integrity_check: "ok" })
    } finally {
      client.close()
    }
  })
})

function readColumnNames(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  tableName: string
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
    .all()
    .map(({ name }) => name)
}

function readObjectNames(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type IN ('table', 'view')"
    )
    .all()
    .map(({ name }) => name)
}
