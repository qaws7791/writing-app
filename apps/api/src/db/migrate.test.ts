import { Database } from "bun:sqlite"
import { describe, expect, it } from "vitest"

import { currentSchemaBaseline, runApplicationMigrations } from "@/db/migrate"
import { requiredApplicationTableNames } from "@/db/required-application-tables"

const immutableContentTriggerNames = [
  "content_assets_published_delete_guard",
  "content_assets_published_insert_guard",
  "content_assets_published_update_guard",
  "course_curriculum_versions_published_delete_guard",
  "course_curriculum_versions_published_update_guard",
  "course_unit_versions_published_delete_guard",
  "course_unit_versions_published_insert_guard",
  "course_unit_versions_published_update_guard",
  "courses_published_version_insert_check",
  "courses_published_version_update_check",
  "lesson_step_versions_published_delete_guard",
  "lesson_step_versions_published_insert_guard",
  "lesson_step_versions_published_update_guard",
  "lesson_versions_published_delete_guard",
  "lesson_versions_published_insert_guard",
  "lesson_versions_published_update_guard",
] as const

describe("application migration", () => {
  it("빈 DB를 현재 baseline으로 한 번만 생성하고 DB 제약을 활성화한다", () => {
    const sqlite = new Database(":memory:")
    sqlite.exec("PRAGMA foreign_keys = ON")

    try {
      expect(runApplicationMigrations(sqlite)).toEqual([
        { execution: "applied", id: currentSchemaBaseline.id },
        { execution: "applied", id: "0001-reporting-views" },
      ])
      expect(runApplicationMigrations(sqlite)).toEqual([
        { execution: "skipped", id: currentSchemaBaseline.id },
        { execution: "skipped", id: "0001-reporting-views" },
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
        {
          checksum:
            "3733a851c5c3646d1f8f42b76ff94b688918020d7f1377eb33ab1f974abd770c",
          id: "0001-reporting-views",
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
      const migratedTableNames = sqlite
        .query<{ readonly name: string }, []>(`
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
              AND name NOT LIKE 'sqlite_%'
              AND name <> 'api_schema_migrations'
            ORDER BY name
          `)
        .all()
        .map(({ name }) => name)
      expect(requiredApplicationTableNames).toHaveLength(26)
      expect(migratedTableNames).toEqual(requiredApplicationTableNames)
      expect(migratedTableNames).not.toEqual(
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
      expect(
        sqlite
          .query<{ readonly name: string }, []>(`
            SELECT name
            FROM sqlite_master
            WHERE type = 'trigger'
            ORDER BY name
          `)
          .all()
          .map(({ name }) => name)
      ).toEqual([...immutableContentTriggerNames].sort())

      sqlite.exec(`
        INSERT INTO courses (created_at, id, sort_order, status)
        VALUES (0, 'migration-course', 1, 'active');

        INSERT INTO course_curriculum_versions (
          category,
          course_id,
          created_at,
          description,
          edit_version,
          id,
          published_at,
          revision,
          status,
          title,
          updated_at,
          visual_key
        )
        VALUES (
          'writing',
          'migration-course',
          0,
          'migration invariant fixture',
          0,
          'migration-published-version',
          0,
          1,
          'published',
          'Published',
          0,
          'warm-paper'
        );
      `)

      expect(() =>
        sqlite.exec(`
          UPDATE course_curriculum_versions
          SET title = 'Changed'
          WHERE id = 'migration-published-version'
        `)
      ).toThrow("published curriculum version is immutable")
      expect(() =>
        sqlite.exec(`
          INSERT INTO content_assets (
            alt_text,
            byte_size,
            content_type,
            course_id,
            created_at,
            curriculum_version_id,
            id,
            kind,
            object_key,
            status,
            updated_at
          )
          VALUES (
            '대체 텍스트',
            1024,
            'image/webp',
            'migration-course',
            0,
            'migration-published-version',
            'migration-asset',
            'course-cover',
            'content/migration-asset.webp',
            'active',
            0
          )
        `)
      ).toThrow("published content asset is immutable")
    } finally {
      sqlite.close()
    }
  })

  it("migration 이력 없이 application table이 있는 DB를 변경하지 않고 거부한다", () => {
    const sqlite = new Database(":memory:")

    try {
      sqlite.exec("CREATE TABLE unknown_application_state (id TEXT)")

      expect(() => runApplicationMigrations(sqlite)).toThrow(
        "migration 이력이 없는 비어 있지 않은 database"
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

  it("baseline manifest에 없는 migration ID를 거부한다", () => {
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
