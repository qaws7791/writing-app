import { describe, expect, it } from "vitest"

import { createInMemoryWritingAppDatabase } from "@workspace/db/client"

import {
  assertLegacyResourceLibraryMigrationPrerequisites,
  prepareLegacyResourceLibraryState,
} from "@/db/legacy-resource-library-migration"

describe("known legacy resource-library migration", () => {
  it("10개 node/document/search와 revision을 보존하고 멱등 변환한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createKnownLegacyResourceFixture(database.sqlite)
      expect(() =>
        assertLegacyResourceLibraryMigrationPrerequisites(database.sqlite)
      ).not.toThrow()

      database.sqlite.exec("BEGIN IMMEDIATE")
      prepareLegacyResourceLibraryState(database.sqlite)
      database.sqlite.exec("COMMIT")

      expect(readColumns(database.sqlite, "admin_resource_documents")).toEqual([
        "node_id",
        "content_markdown",
        "version",
      ])
      expect(readColumns(database.sqlite, "admin_resource_search")).toEqual([
        "node_id",
        "name",
        "body_text",
      ])
      expect(readRows(database.sqlite)).toEqual(createExpectedRows())
      expect(
        database.sqlite
          .query<{ readonly count: number }, []>(
            "SELECT COUNT(*) AS count FROM admin_resource_assets"
          )
          .get()
      ).toEqual({ count: 0 })
      expect(
        database.sqlite
          .query<
            { readonly status: string; readonly trashRootId: string | null },
            []
          >(`
            SELECT status, trash_root_id AS trashRootId
            FROM admin_resource_nodes
            WHERE id = 'document-10'
          `)
          .get()
      ).toEqual({ status: "trashed", trashRootId: "document-10" })

      database.sqlite.exec("BEGIN IMMEDIATE")
      prepareLegacyResourceLibraryState(database.sqlite)
      database.sqlite.exec("COMMIT")
      expect(readRows(database.sqlite)).toEqual(createExpectedRows())
    } finally {
      database.close()
    }
  })

  it("상위 transaction rollback 시 legacy schema와 row를 복원한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createKnownLegacyResourceFixture(database.sqlite)
      database.sqlite.exec("BEGIN IMMEDIATE")
      prepareLegacyResourceLibraryState(database.sqlite)
      database.sqlite.exec("ROLLBACK")

      expect(readColumns(database.sqlite, "admin_resource_documents")).toEqual([
        "node_id",
        "content_markdown",
        "content_revision",
      ])
      expect(readColumns(database.sqlite, "admin_resource_search")).toEqual([
        "node_id",
        "kind",
        "name",
        "body_text",
      ])
      expect(readTableNames(database.sqlite)).not.toContain(
        "admin_resource_assets"
      )
      expect(
        database.sqlite
          .query<
            { readonly contentRevision: number; readonly nodeId: string },
            []
          >(`
            SELECT node_id AS nodeId,
                   content_revision AS contentRevision
            FROM admin_resource_documents
            ORDER BY node_id
          `)
          .all()
      ).toHaveLength(10)
    } finally {
      database.close()
    }
  })

  it("정확히 식별되지 않는 partial schema는 변경 전에 거부한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createKnownLegacyResourceFixture(database.sqlite)
      database.sqlite.exec(
        "CREATE TABLE admin_resource_assets (id TEXT PRIMARY KEY)"
      )

      expect(() =>
        assertLegacyResourceLibraryMigrationPrerequisites(database.sqlite)
      ).toThrow("unsupported partial resource-library schema")
      expect(
        readColumns(database.sqlite, "admin_resource_documents")
      ).toContain("content_revision")
    } finally {
      database.close()
    }
  })
})

function createKnownLegacyResourceFixture(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    CREATE TABLE admin_user (id TEXT PRIMARY KEY NOT NULL);
    INSERT INTO admin_user VALUES ('admin-1');

    CREATE TABLE admin_resource_nodes (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL,
      parent_id TEXT REFERENCES admin_resource_nodes(id),
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      status TEXT NOT NULL,
      trash_root_id TEXT REFERENCES admin_resource_nodes(id),
      created_by TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE admin_resource_documents (
      node_id TEXT PRIMARY KEY NOT NULL
        REFERENCES admin_resource_nodes(id) ON DELETE CASCADE,
      content_markdown TEXT NOT NULL,
      content_revision INTEGER NOT NULL
    );
    CREATE VIRTUAL TABLE admin_resource_search USING fts5(
      node_id UNINDEXED,
      kind UNINDEXED,
      name,
      body_text,
      tokenize = 'unicode61'
    );
  `)

  const insertNode = sqlite.query<
    void,
    [string, string, string, number, string, string | null]
  >(`
    INSERT INTO admin_resource_nodes (
      id, kind, parent_id, name, normalized_name, sort_order, status,
      trash_root_id, created_by, updated_by, created_at, updated_at
    ) VALUES (?, 'document', NULL, ?, ?, ?, ?, ?, 'admin-1', 'admin-1', 1, 1)
  `)
  const insertDocument = sqlite.query<void, [string, string, number]>(`
    INSERT INTO admin_resource_documents (
      node_id, content_markdown, content_revision
    ) VALUES (?, ?, ?)
  `)
  const insertSearch = sqlite.query<void, [string, string, string]>(`
    INSERT INTO admin_resource_search (node_id, kind, name, body_text)
    VALUES (?, 'document', ?, ?)
  `)

  for (let index = 1; index <= 10; index += 1) {
    const nodeId = `document-${index.toString().padStart(2, "0")}`
    const name = `문서 ${index}`
    const body = `본문 ${index}`
    insertNode.run(
      nodeId,
      name,
      name,
      index,
      index === 10 ? "archived" : "active",
      index === 10 ? nodeId : null
    )
    insertDocument.run(nodeId, body, index)
    insertSearch.run(nodeId, name, body)
  }
}

function readRows(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): readonly {
  readonly bodyText: string
  readonly contentMarkdown: string
  readonly name: string
  readonly nodeId: string
  readonly version: number
}[] {
  return sqlite
    .query<
      {
        readonly bodyText: string
        readonly contentMarkdown: string
        readonly name: string
        readonly nodeId: string
        readonly version: number
      },
      []
    >(`
      SELECT document.node_id AS nodeId, document.content_markdown AS contentMarkdown,
             document.version, search.name, search.body_text AS bodyText
      FROM admin_resource_documents document
      JOIN admin_resource_search search ON search.node_id = document.node_id
      ORDER BY document.node_id
    `)
    .all()
}

function createExpectedRows(): readonly {
  readonly bodyText: string
  readonly contentMarkdown: string
  readonly name: string
  readonly nodeId: string
  readonly version: number
}[] {
  return Array.from({ length: 10 }, (_, offset) => {
    const index = offset + 1
    return {
      bodyText: `본문 ${index}`,
      contentMarkdown: `본문 ${index}`,
      name: `문서 ${index}`,
      nodeId: `document-${index.toString().padStart(2, "0")}`,
      version: index,
    }
  })
}

function readColumns(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  tableName: string
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
    .all()
    .map(({ name }) => name)
}

function readTableNames(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table'"
    )
    .all()
    .map(({ name }) => name)
}
