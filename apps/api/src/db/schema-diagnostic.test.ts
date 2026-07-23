import { describe, expect, it } from "vitest"

import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineTestMigration } from "@workspace/db/test-support/application-migration"

import { runApplicationMigrations } from "@/db/migrate"
import {
  inspectApplicationDatabase,
  readApplicationDatabaseBackupTables,
} from "@/db/schema-diagnostic"

describe("application database diagnostic", () => {
  it("빈 DB는 안전하게 migration이 필요한 상태로 분류한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      expect(inspectApplicationDatabase(database.sqlite)).toMatchObject({
        checks: {
          foreignKeyViolations: [],
          integrity: "ok",
        },
        issues: [],
        kind: "application-database-diagnostic",
        schema: "empty",
        status: "migration-required",
      })
    } finally {
      database.close()
    }
  })

  it("지원 baseline은 read-only 진단에서 legacy로 분류한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runBaselineTestMigration(database.sqlite)

      expect(inspectApplicationDatabase(database.sqlite)).toMatchObject({
        issues: [],
        kind: "application-database-diagnostic",
        legacySchema: "baseline",
        schema: "legacy",
        status: "migration-required",
      })
    } finally {
      database.close()
    }
  })

  it("현재 schema와 DB 검사가 유효할 때 ok를 반환한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(database.sqlite)
      database.sqlite.exec("PRAGMA query_only = ON")

      expect(inspectApplicationDatabase(database.sqlite)).toMatchObject({
        issues: [],
        kind: "application-database-diagnostic",
        schema: "current",
        status: "ok",
      })
      expect(readApplicationDatabaseBackupTables(database.sqlite)).toEqual(
        expect.arrayContaining([
          "api_schema_migrations",
          "courses",
          "learner_lesson_progress",
        ])
      )
    } finally {
      database.close()
    }
  })

  it("현재 schema에서 migration 이력이 누락되면 migration-required로 분류한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(database.sqlite)
      database.sqlite.exec(`
        DELETE FROM api_schema_migrations
        WHERE id = '0003-remove-unused-operations'
      `)

      expect(inspectApplicationDatabase(database.sqlite)).toMatchObject({
        issues: [],
        kind: "application-database-diagnostic",
        pendingMigrationIds: ["0003-remove-unused-operations"],
        schema: "current",
        status: "migration-required",
      })
    } finally {
      database.close()
    }
  })

  it("migration 이력이 manifest의 연속된 prefix가 아니면 blocked로 분류한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(database.sqlite)
      database.sqlite.exec(`
        DELETE FROM api_schema_migrations
        WHERE id = '0000-writing-app-baseline'
      `)

      expect(inspectApplicationDatabase(database.sqlite)).toMatchObject({
        issues: [{ code: "migration-history-invalid" }],
        schema: "unsupported",
        status: "blocked",
      })
    } finally {
      database.close()
    }
  })

  it("알 수 없는 table과 변조된 migration history를 fail-closed한다", () => {
    const unknownDatabase = createInMemoryWritingAppDatabase()
    const historyDatabase = createInMemoryWritingAppDatabase()

    try {
      unknownDatabase.sqlite.exec("CREATE TABLE unknown_state (id TEXT)")
      expect(inspectApplicationDatabase(unknownDatabase.sqlite)).toMatchObject({
        issues: [{ code: "unknown-schema" }],
        schema: "unsupported",
        status: "blocked",
      })

      runApplicationMigrations(historyDatabase.sqlite)
      historyDatabase.sqlite.exec(`
        UPDATE api_schema_migrations
        SET checksum = '${"f".repeat(64)}'
        WHERE id = '0000-writing-app-baseline'
      `)
      expect(inspectApplicationDatabase(historyDatabase.sqlite)).toMatchObject({
        issues: [{ code: "migration-history-invalid" }],
        schema: "unsupported",
        status: "blocked",
      })
    } finally {
      unknownDatabase.close()
      historyDatabase.close()
    }
  })
})
