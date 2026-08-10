import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { runSqliteMigrations } from "#db/migration-runner"

describe("SQLite migration runner", () => {
  it("migration 실패 시 schema와 이력 row를 함께 rollback한다", () => {
    const sqlite = new Database(":memory:")

    try {
      expect(() =>
        runSqliteMigrations(sqlite, [
          {
            apply(database) {
              database.exec("CREATE TABLE rollback_probe (id TEXT)")
              throw new Error("fault injection")
            },
            checksum: "a".repeat(64),
            foreignKeys: "on",
            id: "0000-rollback-probe",
          },
        ])
      ).toThrow("fault injection")
      expect(
        sqlite
          .query<unknown, []>(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'rollback_probe'"
          )
          .get()
      ).toBeNull()
      expect(
        sqlite
          .query<{ readonly count: number }, []>(
            "SELECT COUNT(*) AS count FROM api_schema_migrations"
          )
          .get()?.count
      ).toBe(0)
    } finally {
      sqlite.close()
    }
  })
})
