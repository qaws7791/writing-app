import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { runSqliteMigrations } from "#db/migration-runner"

const checksum = "a".repeat(64)

describe("SQLite migration runner", () => {
  it("migration과 checksum을 한 번만 기록한다", () => {
    const sqlite = new Database(":memory:")

    try {
      const migration = {
        apply(database: Database) {
          database.exec("CREATE TABLE migration_probe (id TEXT PRIMARY KEY)")
        },
        checksum,
        foreignKeys: "on" as const,
        id: "0000-probe",
      }

      expect(runSqliteMigrations(sqlite, [migration])).toEqual([
        { execution: "applied", id: "0000-probe" },
      ])
      expect(runSqliteMigrations(sqlite, [migration])).toEqual([
        { execution: "skipped", id: "0000-probe" },
      ])
    } finally {
      sqlite.close()
    }
  })

  it("적용된 migration checksum 변경을 거부한다", () => {
    const sqlite = new Database(":memory:")

    try {
      runSqliteMigrations(sqlite, [
        {
          apply: () => undefined,
          checksum,
          foreignKeys: "on",
          id: "0000-probe",
        },
      ])

      expect(() =>
        runSqliteMigrations(sqlite, [
          {
            apply: () => undefined,
            checksum: "b".repeat(64),
            foreignKeys: "on",
            id: "0000-probe",
          },
        ])
      ).toThrow("checksum이 다릅니다")
    } finally {
      sqlite.close()
    }
  })

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
            checksum,
            foreignKeys: "on",
            id: "0000-probe",
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

  it.each([
    ["on", true],
    ["off", false],
  ] as const)(
    "migration이 요청한 FK 모드 %s를 적용하고 connection 상태를 복원한다",
    (requestedMode, expectedDuringMigration) => {
      const sqlite = new Database(":memory:")
      const initialForeignKeys = requestedMode === "on" ? "OFF" : "ON"
      sqlite.exec(`PRAGMA foreign_keys = ${initialForeignKeys}`)

      try {
        let foreignKeysDuringMigration: boolean | undefined

        runSqliteMigrations(sqlite, [
          {
            apply(database) {
              foreignKeysDuringMigration = readForeignKeysEnabled(database)
            },
            checksum,
            foreignKeys: requestedMode,
            id: `0000-foreign-keys-${requestedMode}`,
          },
        ])

        expect(foreignKeysDuringMigration).toBe(expectedDuringMigration)
        expect(readForeignKeysEnabled(sqlite)).toBe(initialForeignKeys === "ON")
      } finally {
        sqlite.close()
      }
    }
  )
})

function readForeignKeysEnabled(sqlite: Database): boolean {
  return (
    sqlite
      .query<{ readonly enabled: number }, []>(
        "SELECT foreign_keys AS enabled FROM pragma_foreign_keys"
      )
      .get()?.enabled === 1
  )
}
