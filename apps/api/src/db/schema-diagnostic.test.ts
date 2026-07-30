import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"

import { runApplicationMigrations } from "@/db/migrate"
import { inspectApplicationDatabase } from "@/db/schema-diagnostic"

describe("application database diagnostic", () => {
  it("빈 DB는 migration-required로 분류한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      expect(inspectApplicationDatabase(client.sqlite)).toMatchObject({
        checks: { foreignKeyViolations: [], integrity: "ok" },
        schema: "empty",
        status: "migration-required",
      })
    } finally {
      client.close()
    }
  })

  it("baseline 이력과 DB 검사가 유효하면 ok를 반환한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(client.sqlite)

      expect(inspectApplicationDatabase(client.sqlite)).toMatchObject({
        checks: { foreignKeyViolations: [], integrity: "ok" },
        schema: "current",
        status: "ok",
      })
    } finally {
      client.close()
    }
  })

  it("필수 table이 하나라도 없는 부분 schema를 차단한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(client.sqlite)
      client.sqlite.exec("DROP TABLE audit_events")

      expect(inspectApplicationDatabase(client.sqlite)).toMatchObject({
        issues: [{ code: "schema-table-mismatch" }],
        schema: "unsupported",
        status: "blocked",
      })
    } finally {
      client.close()
    }
  })

  it("제거된 table이 남아 있는 schema를 차단한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(client.sqlite)
      client.sqlite.exec(
        "CREATE TABLE admin_resource_nodes (id TEXT PRIMARY KEY)"
      )

      expect(inspectApplicationDatabase(client.sqlite)).toMatchObject({
        issues: [{ code: "schema-table-mismatch" }],
        schema: "unsupported",
        status: "blocked",
      })
    } finally {
      client.close()
    }
  })

  it("application table에 migration 이력이 없으면 차단한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      client.sqlite.exec("CREATE TABLE unknown_application_state (id TEXT)")

      expect(inspectApplicationDatabase(client.sqlite)).toMatchObject({
        issues: [{ code: "unmanaged-database" }],
        schema: "unsupported",
        status: "blocked",
      })
    } finally {
      client.close()
    }
  })

  it("알 수 없는 migration 이력을 차단한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      client.sqlite.exec(`
        CREATE TABLE api_schema_migrations (
          id TEXT PRIMARY KEY NOT NULL,
          checksum TEXT NOT NULL,
          applied_at INTEGER NOT NULL
        );
        INSERT INTO api_schema_migrations (id, checksum, applied_at)
        VALUES ('9999-unknown', '${"a".repeat(64)}', 0);
        CREATE TABLE application_state (id TEXT);
      `)

      expect(inspectApplicationDatabase(client.sqlite)).toMatchObject({
        issues: [{ code: "migration-history-invalid" }],
        schema: "unsupported",
        status: "blocked",
      })
    } finally {
      client.close()
    }
  })
})
