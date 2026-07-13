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
      expect(
        readColumnNames(client.sqlite, "admin_resource_collaboration_updates")
      ).toEqual([
        "document_id",
        "state_version",
        "content_revision",
        "transaction_id",
        "actor_id",
        "yjs_update",
        "created_at",
      ])
      expect(
        readColumnNames(
          client.sqlite,
          "admin_resource_collaboration_transactions"
        )
      ).toEqual([
        "document_id",
        "transaction_id",
        "state_version",
        "content_revision",
        "actor_id",
        "created_at",
      ])
      expect(readObjectNames(client.sqlite)).toEqual(
        expect.arrayContaining([
          "admin_resource_audit_events",
          "admin_resource_collaboration",
          "admin_resource_collaboration_updates",
          "admin_resource_collaboration_transactions",
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

  it("기존 관리자 인증 schema에서 MFA column과 table을 제거한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      client.sqlite.exec(`
        CREATE TABLE admin_user (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          email_verified INTEGER NOT NULL,
          image TEXT,
          role TEXT NOT NULL DEFAULT 'operator',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `)

      client.sqlite.exec(`
        ALTER TABLE admin_user ADD COLUMN two_factor_enabled INTEGER NOT NULL DEFAULT 0;
        CREATE TABLE admin_two_factor (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          secret TEXT NOT NULL,
          backup_codes TEXT NOT NULL,
          verified INTEGER NOT NULL DEFAULT 0,
          failed_verification_count INTEGER NOT NULL DEFAULT 0,
          locked_until INTEGER
        );
        CREATE TABLE admin_mfa_recovery_code (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          code_hash TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL,
          used_at INTEGER
        );
      `)

      runBaselineMigration(client.sqlite)

      expect(readColumnNames(client.sqlite, "admin_user")).not.toContain(
        "two_factor_enabled"
      )
      expect(readObjectNames(client.sqlite)).not.toEqual(
        expect.arrayContaining(["admin_mfa_recovery_code", "admin_two_factor"])
      )
      expect(
        client.sqlite
          .query<{ readonly integrity_check: string }, []>(
            "PRAGMA integrity_check"
          )
          .get()
      ).toEqual({ integrity_check: "ok" })
      expect(
        client.sqlite
          .query<{ readonly table: string }, []>("PRAGMA foreign_key_check")
          .all()
      ).toEqual([])
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
