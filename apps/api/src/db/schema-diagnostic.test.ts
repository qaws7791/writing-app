import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { runApplicationMigrations } from "@/db/migrate"
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

  it("현재 baseline 계보와 DB 검사가 유효하면 ok를 반환한다", () => {
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

  it("application table에 현재 schema era 선언이 없으면 차단한다", () => {
    const sqlite = new Database(":memory:")

    try {
      sqlite.exec("CREATE TABLE unknown_application_state (id TEXT)")

      expect(inspectApplicationDatabase(sqlite)).toMatchObject({
        issues: [{ code: "schema-era-missing" }],
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
