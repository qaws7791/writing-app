import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { currentSchemaBaseline, runApplicationMigrations } from "@/db/migrate"

describe("application migration", () => {
  it("빈 DB를 현재 baseline으로 한 번만 생성하고 DB 제약을 활성화한다", () => {
    const sqlite = new Database(":memory:")
    sqlite.exec("PRAGMA foreign_keys = ON")

    try {
      expect(runApplicationMigrations(sqlite)).toEqual([
        { execution: "applied", id: currentSchemaBaseline.id },
      ])
      expect(runApplicationMigrations(sqlite)).toEqual([
        { execution: "skipped", id: currentSchemaBaseline.id },
      ])
      expect(
        sqlite
          .query<{ readonly checksum: string; readonly id: string }, []>(`
            SELECT id, checksum
            FROM api_schema_migrations
          `)
          .all()
      ).toEqual([
        {
          checksum: currentSchemaBaseline.checksum,
          id: currentSchemaBaseline.id,
        },
      ])
      expect(
        sqlite
          .query<{ readonly result: string }, []>(
            "SELECT integrity_check AS result FROM pragma_integrity_check"
          )
          .get()?.result
      ).toBe("ok")
      expect(
        sqlite.query<unknown, []>("PRAGMA foreign_key_check").get()
      ).toBeNull()
      expect(
        sqlite
          .query<{ readonly table: string }, []>(
            "PRAGMA foreign_key_list(learner_course_progress)"
          )
          .all()
          .map(({ table }) => table)
      ).toEqual(expect.arrayContaining(["course_curriculum_versions", "user"]))
    } finally {
      sqlite.close()
    }
  })

  it("schema era 선언 없이 application table이 있는 DB를 변경하지 않고 거부한다", () => {
    const sqlite = new Database(":memory:")

    try {
      sqlite.exec("CREATE TABLE unknown_application_state (id TEXT)")

      expect(() => runApplicationMigrations(sqlite)).toThrow(
        "현재 schema era가 선언되지 않은 database"
      )
      expect(
        sqlite
          .query<{ readonly present: number }, []>(`
            SELECT EXISTS (
              SELECT 1
              FROM sqlite_master
              WHERE type = 'table' AND name = 'api_schema_migrations'
            ) AS present
          `)
          .get()?.present
      ).toBe(0)
    } finally {
      sqlite.close()
    }
  })

  it("현재 계보에 없는 migration ID를 거부한다", () => {
    const sqlite = new Database(":memory:")

    try {
      sqlite.exec(`
        CREATE TABLE api_schema_migrations (
          id TEXT PRIMARY KEY NOT NULL,
          checksum TEXT NOT NULL,
          applied_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        INSERT INTO api_schema_migrations (id, checksum)
        VALUES ('0000-writing-app-baseline', '${"a".repeat(64)}');
      `)

      expect(() => runApplicationMigrations(sqlite)).toThrow(
        "알 수 없는 적용 migration"
      )
    } finally {
      sqlite.close()
    }
  })
})
