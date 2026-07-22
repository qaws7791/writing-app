import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineTestMigration } from "@workspace/db/test-support/application-migration"

import {
  assertResourceLibraryMigrationPrerequisites,
  runResourceLibrarySchemaMigration,
} from "#resource-library/infrastructure/persistence/schema-migration"

describe("resource-library schema migration", () => {
  it("기존 row를 보존하고 cross-module FK를 제거한 뒤 재실행할 수 있다", () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runBaselineTestMigration(database.sqlite)
      insertAdmin(database.sqlite, "admin-1")
      database.sqlite.exec(`
        INSERT INTO admin_resource_nodes (
          id, kind, parent_id, name, normalized_name, status, trash_root_id,
          created_by, updated_by, created_at, updated_at
        ) VALUES (
          'document-1', 'document', NULL, '운영 기준', '운영 기준',
          'active', NULL, 'admin-1', 'admin-1', 1000, 1000
        );
        INSERT INTO admin_resource_documents (node_id, content_markdown, version)
        VALUES ('document-1', '본문', 3);
        INSERT INTO admin_resource_assets (
          id, document_id, r2_object_key, content_type, byte_size, created_at
        ) VALUES (
          'asset-1', 'document-1', 'resource-library/document-1/asset-1.png',
          'image/png', 8, 1000
        );
        INSERT INTO admin_resource_search (node_id, name, body_text)
        VALUES ('document-1', '운영 기준', '본문');
      `)

      runResourceLibrarySchemaMigration(database.sqlite)
      runResourceLibrarySchemaMigration(database.sqlite)

      expect(
        readForeignKeyTables(database.sqlite, "admin_resource_nodes")
      ).toEqual(["admin_resource_nodes", "admin_resource_nodes"])
      expect(
        readForeignKeyTables(database.sqlite, "admin_resource_documents")
      ).toEqual(["admin_resource_nodes"])
      expect(
        readForeignKeyTables(database.sqlite, "admin_resource_assets")
      ).toEqual(["admin_resource_documents", "admin_resource_nodes"])
      expect(
        database.sqlite
          .query<
            {
              readonly altText: string
              readonly contentMarkdown: string
              readonly status: string
              readonly version: number
            },
            []
          >(`
            SELECT asset.alt_text AS altText, asset.status,
              document.content_markdown AS contentMarkdown, document.version
            FROM admin_resource_assets AS asset
            INNER JOIN admin_resource_documents AS document
              ON document.node_id = asset.document_id
          `)
          .get()
      ).toEqual({
        altText: "기존 이미지",
        contentMarkdown: "본문",
        status: "active",
        version: 3,
      })
      expect(
        database.sqlite.query<unknown, []>("PRAGMA foreign_key_check").all()
      ).toEqual([])
      expect(readIndexes(database.sqlite)).toEqual(
        expect.arrayContaining([
          "admin_resource_assets_delete_pending_idx",
          "admin_resource_assets_document_idx",
          "admin_resource_nodes_parent_name_idx",
        ])
      )
    } finally {
      database.close()
    }
  })

  it("legacy actor orphan을 cross-module FK 제거 전에 fail-closed한다", () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runBaselineTestMigration(database.sqlite)
      database.sqlite.exec("PRAGMA foreign_keys = OFF")
      database.sqlite.exec(`
        INSERT INTO admin_resource_nodes (
          id, kind, parent_id, name, normalized_name, status, trash_root_id,
          created_by, updated_by, created_at, updated_at
        ) VALUES (
          'document-1', 'document', NULL, '운영 기준', '운영 기준',
          'active', NULL, 'missing-admin', 'missing-admin', 1000, 1000
        );
      `)
      database.sqlite.exec("PRAGMA foreign_keys = ON")

      expect(() =>
        assertResourceLibraryMigrationPrerequisites(database.sqlite)
      ).toThrow(
        "resource-library migration prerequisite failed: unknown actor for node document-1"
      )
      expect(() => runResourceLibrarySchemaMigration(database.sqlite)).toThrow(
        "resource-library migration prerequisite failed"
      )
    } finally {
      database.close()
    }
  })

  it("빈 database에는 module schema와 FTS를 만들고 partial schema는 거절한다", () => {
    const fresh = createInMemoryWritingAppDatabase()
    const partial = createInMemoryWritingAppDatabase()
    try {
      runResourceLibrarySchemaMigration(fresh.sqlite)
      expect(readTables(fresh.sqlite)).toEqual(
        expect.arrayContaining([
          "admin_resource_assets",
          "admin_resource_documents",
          "admin_resource_nodes",
          "admin_resource_search",
        ])
      )

      partial.sqlite.exec("CREATE TABLE admin_resource_nodes (id TEXT)")
      expect(() => runResourceLibrarySchemaMigration(partial.sqlite)).toThrow(
        "resource-library migration prerequisite failed: partial schema"
      )
    } finally {
      fresh.close()
      partial.close()
    }
  })
})

function insertAdmin(
  sqlite: Parameters<typeof runBaselineTestMigration>[0],
  adminId: string
): void {
  sqlite
    .query<unknown, [string, string, string, number, number]>(`
      INSERT INTO admin_user (
        id, name, email, email_verified, role, created_at, updated_at
      ) VALUES (?, ?, ?, 1, 'owner', ?, ?)
    `)
    .run(adminId, "관리자", `${adminId}@example.com`, 1000, 1000)
}

function readForeignKeyTables(
  sqlite: Parameters<typeof runBaselineTestMigration>[0],
  tableName: string
): readonly string[] {
  return sqlite
    .query<{ readonly table: string }, []>(
      `PRAGMA foreign_key_list(${tableName})`
    )
    .all()
    .map(({ table }) => table)
    .sort()
}

function readIndexes(
  sqlite: Parameters<typeof runBaselineTestMigration>[0]
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'admin_resource_%'"
    )
    .all()
    .map(({ name }) => name)
}

function readTables(
  sqlite: Parameters<typeof runBaselineTestMigration>[0]
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table'"
    )
    .all()
    .map(({ name }) => name)
}
