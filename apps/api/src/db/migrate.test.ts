import { describe, expect, it } from "vitest"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"

import { currentSchemaBaseline, runApplicationMigrations } from "@/db/migrate"
import { requiredApplicationTableNames } from "@/db/required-application-tables"

describe("application migration", () => {
  it("빈 DB에 baseline과 reporting view를 한 번만 적용하고 재실행은 skip한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      expect(runApplicationMigrations(client.sqlite)).toEqual([
        { execution: "applied", id: currentSchemaBaseline.id },
        { execution: "applied", id: "0001-reporting-views" },
      ])
      expect(runApplicationMigrations(client.sqlite)).toEqual([
        { execution: "skipped", id: currentSchemaBaseline.id },
        { execution: "skipped", id: "0001-reporting-views" },
      ])
      expect(
        client.sqlite
          .query<{ readonly result: string }, []>(
            "SELECT integrity_check AS result FROM pragma_integrity_check"
          )
          .get()?.result
      ).toBe("ok")
      expect(
        client.sqlite.query<unknown, []>("PRAGMA foreign_key_check").get()
      ).toBeNull()
      expect(
        client.sqlite
          .query<{ readonly table: string }, []>(
            "PRAGMA foreign_key_list(learner_course_progress)"
          )
          .all()
          .map(({ table }) => table)
      ).toEqual(expect.arrayContaining(["course_curriculum_versions", "user"]))
      expect(readMigratedTableNames(client)).toEqual(
        requiredApplicationTableNames
      )
    } finally {
      client.close()
    }
  })

  it("published curriculum version의 update와 published content asset의 insert를 trigger로 차단한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(client.sqlite)
      seedPublishedCurriculumVersion(client)

      expect(() =>
        client.sqlite.exec(`
          UPDATE course_curriculum_versions
          SET title = 'Changed'
          WHERE id = 'migration-published-version'
        `)
      ).toThrow("published curriculum version is immutable")
      expect(() =>
        client.sqlite.exec(`
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
      client.close()
    }
  })

  it("migration 이력 없이 application table이 있는 DB를 변경하지 않고 거부한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      client.sqlite.exec("CREATE TABLE unknown_application_state (id TEXT)")

      expect(() => runApplicationMigrations(client.sqlite)).toThrow(
        "migration 이력이 없는 비어 있지 않은 database"
      )
      expect(
        client.sqlite
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
      client.close()
    }
  })

  it("baseline manifest에 없는 migration ID를 거부한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      client.sqlite.exec(`
        CREATE TABLE api_schema_migrations (
          id TEXT PRIMARY KEY NOT NULL,
          checksum TEXT NOT NULL,
          applied_at INTEGER NOT NULL DEFAULT (unixepoch())
        );
        INSERT INTO api_schema_migrations (id, checksum)
        VALUES ('0000-writing-app-baseline', '${"a".repeat(64)}');
      `)

      expect(() => runApplicationMigrations(client.sqlite)).toThrow(
        "알 수 없는 적용 migration"
      )
    } finally {
      client.close()
    }
  })
})

function readMigratedTableNames(
  client: WritingAppDatabaseClient
): readonly string[] {
  return client.sqlite
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
}

function seedPublishedCurriculumVersion(
  client: WritingAppDatabaseClient
): void {
  client.sqlite.exec(`
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
}
