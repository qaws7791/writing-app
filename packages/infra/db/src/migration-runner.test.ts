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

  it("migration이 요청한 FK 모드를 강제하고 기존 connection 상태를 복원한다", () => {
    const initiallyDisabled = new Database(":memory:")
    const initiallyEnabled = new Database(":memory:")
    initiallyEnabled.exec("PRAGMA foreign_keys = ON")

    try {
      let enabledDuringMigration = false
      let disabledDuringMigration = false

      runSqliteMigrations(initiallyDisabled, [
        {
          apply(database) {
            enabledDuringMigration = readForeignKeysEnabled(database)
          },
          checksum,
          foreignKeys: "on",
          id: "0000-enable-foreign-keys",
        },
      ])
      runSqliteMigrations(initiallyEnabled, [
        {
          apply(database) {
            disabledDuringMigration = !readForeignKeysEnabled(database)
          },
          checksum,
          foreignKeys: "off",
          id: "0000-disable-foreign-keys",
        },
      ])

      expect(enabledDuringMigration).toBe(true)
      expect(disabledDuringMigration).toBe(true)
      expect(readForeignKeysEnabled(initiallyDisabled)).toBe(false)
      expect(readForeignKeysEnabled(initiallyEnabled)).toBe(true)
    } finally {
      initiallyEnabled.close()
      initiallyDisabled.close()
    }
  })
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
