import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { runApplicationMigrations } from "@/db/migrate"
import { requiredApplicationTableNames } from "@/db/required-application-tables"
import { inspectApplicationDatabase } from "@/db/schema-diagnostic"

describe("application database diagnostic", () => {
  it("빈 DB는 migration-required로 분류한다", () => {
    const sqlite = new Database(":memory:")

    try {
      expect(inspectApplicationDatabase(sqlite)).toMatchObject({
        checks: { foreignKeyViolations: [], integrity: "ok" },
        schema: "empty",
        status: "migration-required",
      })
    } finally {
      sqlite.close()
    }
  })

  it("baseline 이력과 DB 검사가 유효하면 ok를 반환한다", () => {
    const sqlite = new Database(":memory:")
    sqlite.exec("PRAGMA foreign_keys = ON")

    try {
      runApplicationMigrations(sqlite)

      expect(inspectApplicationDatabase(sqlite)).toMatchObject({
        checks: { foreignKeyViolations: [], integrity: "ok" },
        schema: "current",
        status: "ok",
      })
    } finally {
      sqlite.close()
    }
  })

  it("현재 schema의 26개 table만 요구하고 제거된 table은 포함하지 않는다", () => {
    expect(requiredApplicationTableNames).toHaveLength(26)
    expect(requiredApplicationTableNames).not.toEqual(
      expect.arrayContaining([
        "admin_ai_chat_conversations",
        "admin_ai_chat_messages",
        "admin_identity_profiles",
        "admin_resource_assets",
        "admin_resource_documents",
        "admin_resource_nodes",
        "operations_ai_quota_counters",
      ])
    )
  })

  it("migration 이력만 현재인 부분 schema와 제거된 잔존 table을 차단한다", () => {
    const missingTableDatabase = new Database(":memory:")
    const unexpectedTableDatabase = new Database(":memory:")

    try {
      runApplicationMigrations(missingTableDatabase)
      missingTableDatabase.exec("DROP TABLE audit_events")
      expect(inspectApplicationDatabase(missingTableDatabase)).toMatchObject({
        issues: [{ code: "schema-table-mismatch" }],
        schema: "unsupported",
        status: "blocked",
      })

      runApplicationMigrations(unexpectedTableDatabase)
      unexpectedTableDatabase.exec(
        "CREATE TABLE admin_resource_nodes (id TEXT PRIMARY KEY)"
      )
      expect(inspectApplicationDatabase(unexpectedTableDatabase)).toMatchObject(
        {
          issues: [{ code: "schema-table-mismatch" }],
          schema: "unsupported",
          status: "blocked",
        }
      )
    } finally {
      missingTableDatabase.close()
      unexpectedTableDatabase.close()
    }
  })

  it("application table에 migration 이력이 없으면 차단한다", () => {
    const sqlite = new Database(":memory:")

    try {
      sqlite.exec("CREATE TABLE unknown_application_state (id TEXT)")

      expect(inspectApplicationDatabase(sqlite)).toMatchObject({
        issues: [{ code: "unmanaged-database" }],
        schema: "unsupported",
        status: "blocked",
      })
    } finally {
      sqlite.close()
    }
  })

  it("알 수 없는 migration 이력을 차단한다", () => {
    const sqlite = new Database(":memory:")

    try {
      sqlite.exec(`
        CREATE TABLE api_schema_migrations (
          id TEXT PRIMARY KEY NOT NULL,
          checksum TEXT NOT NULL,
          applied_at INTEGER NOT NULL
        );
        INSERT INTO api_schema_migrations (id, checksum, applied_at)
        VALUES ('9999-unknown', '${"a".repeat(64)}', 0);
        CREATE TABLE application_state (id TEXT);
      `)

      expect(inspectApplicationDatabase(sqlite)).toMatchObject({
        issues: [{ code: "migration-history-invalid" }],
        schema: "unsupported",
        status: "blocked",
      })
    } finally {
      sqlite.close()
    }
  })
})
