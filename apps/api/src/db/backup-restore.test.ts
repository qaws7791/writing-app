import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { createContentModule } from "@workspace/content/module"
import {
  createReadOnlyWritingAppDatabase,
  createWritingAppDatabase,
} from "@workspace/db/client"
import { ok } from "@workspace/kernel/result"

import { createVerifiedApplicationDatabaseBackup } from "@/db/application-database-backup"
import { inspectApplicationDatabase } from "@/db/schema-diagnostic"
import { seedApplicationDatabase } from "@/db/seed"

describe("P11 schema backup과 독립 restore", () => {
  it("seed된 현재 schema snapshot을 별도 경로에서 검증하고 application read를 수행한다", async () => {
    const directory = mkdtempSync(join(tmpdir(), "writing app p11 restore "))
    const sourcePath = join(directory, "source.sqlite")
    const backupPath = join(directory, "backup", "snapshot.sqlite")
    const source = createWritingAppDatabase(sourcePath)

    try {
      await seedApplicationDatabase(source)
      source.close()

      const report = createVerifiedApplicationDatabaseBackup({
        backupPath,
        sourcePath,
      })
      expect(report.verification).toMatchObject({
        integrityCheck: "ok",
        requiredTableReadSmoke: "ok",
      })

      const restored = createReadOnlyWritingAppDatabase(backupPath)
      try {
        expect(
          restored.sqlite
            .query<{ readonly id: string }, []>(
              "SELECT id FROM api_schema_migrations ORDER BY id"
            )
            .all()
        ).toEqual([
          { id: "0000-writing-app-baseline" },
          { id: "0001-module-schema-ownership" },
          { id: "0002-cross-module-reference-integrity" },
        ])
        const content = createContentModule({
          clock: { now: () => new Date("2026-07-23T00:00:00.000Z") },
          courseIdGenerator: { next: () => "unused" as never },
          database: restored.db,
          resetGuard: { authorize: () => ok(undefined) },
        })
        await expect(
          content.learningQuery.listPublishedCourses()
        ).resolves.not.toHaveLength(0)
      } finally {
        restored.close()
      }
    } finally {
      source.close()
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("지원되는 legacy schema의 실제 table 전체를 검증해 snapshot한다", () => {
    const directory = mkdtempSync(join(tmpdir(), "writing app legacy backup "))
    const sourcePath = join(directory, "legacy.sqlite")
    const backupPath = join(directory, "backup", "snapshot.sqlite")
    const source = createWritingAppDatabase(sourcePath)

    try {
      createEmptyLegacyCurriculumSchema(source.sqlite)
      expect(inspectApplicationDatabase(source.sqlite)).toMatchObject({
        legacySchema: "curriculum",
        schema: "legacy",
        status: "migration-required",
      })
      source.close()

      expect(
        createVerifiedApplicationDatabaseBackup({ backupPath, sourcePath })
      ).toMatchObject({
        kind: "database-backup-verified",
        verification: {
          integrityCheck: "ok",
          requiredTableReadSmoke: "ok",
        },
      })

      const restored = createReadOnlyWritingAppDatabase(backupPath)
      try {
        expect(
          restored.sqlite
            .query<{ readonly name: string }, []>(`
              SELECT name
              FROM sqlite_master
              WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
              ORDER BY name
            `)
            .all()
            .map(({ name }) => name)
        ).toEqual([
          "ai_feedback_attempts",
          "course_units",
          "courses",
          "learner_lesson_answers",
          "learner_lesson_progress",
          "lesson_steps",
          "lessons",
        ])
      } finally {
        restored.close()
      }
    } finally {
      source.close()
      rmSync(directory, { force: true, recursive: true })
    }
  })

  it("빈 DB는 snapshot하고 unsupported schema는 backup 전에 차단한다", () => {
    const directory = mkdtempSync(join(tmpdir(), "writing app backup state "))
    const emptyPath = join(directory, "empty.sqlite")
    const unknownPath = join(directory, "unknown.sqlite")
    const emptyBackupPath = join(directory, "empty-backup.sqlite")
    const blockedBackupPath = join(directory, "blocked-backup.sqlite")
    const empty = createWritingAppDatabase(emptyPath)
    const unknown = createWritingAppDatabase(unknownPath)

    try {
      empty.close()
      unknown.sqlite.exec("CREATE TABLE unknown_state (id TEXT)")
      unknown.close()

      expect(
        createVerifiedApplicationDatabaseBackup({
          backupPath: emptyBackupPath,
          sourcePath: emptyPath,
        })
      ).toMatchObject({
        kind: "database-backup-verified",
        verification: { requiredTableReadSmoke: "ok" },
      })
      expect(() =>
        createVerifiedApplicationDatabaseBackup({
          backupPath: blockedBackupPath,
          sourcePath: unknownPath,
        })
      ).toThrow("database backup blocked")
    } finally {
      empty.close()
      unknown.close()
      rmSync(directory, { force: true, recursive: true })
    }
  })
})

function createEmptyLegacyCurriculumSchema(
  sqlite: ReturnType<typeof createWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    CREATE TABLE courses (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      visual_key TEXT NOT NULL,
      status TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      curriculum_revision INTEGER NOT NULL
    );
    CREATE TABLE course_units (
      id TEXT PRIMARY KEY NOT NULL,
      course_id TEXT NOT NULL REFERENCES courses(id),
      title TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      status TEXT NOT NULL
    );
    CREATE TABLE lessons (
      id TEXT PRIMARY KEY NOT NULL,
      course_id TEXT NOT NULL REFERENCES courses(id),
      unit_id TEXT NOT NULL REFERENCES course_units(id),
      title TEXT NOT NULL,
      category TEXT,
      description TEXT,
      estimated_minutes INTEGER NOT NULL,
      summary_json TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      status TEXT NOT NULL
    );
    CREATE TABLE lesson_steps (
      id TEXT PRIMARY KEY NOT NULL,
      lesson_id TEXT NOT NULL REFERENCES lessons(id),
      type TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      content_json TEXT NOT NULL,
      status TEXT NOT NULL
    );
    CREATE TABLE learner_lesson_progress (
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL REFERENCES lessons(id),
      current_step_index INTEGER NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, lesson_id)
    );
    CREATE TABLE learner_lesson_answers (
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL REFERENCES lessons(id),
      step_id TEXT NOT NULL REFERENCES lesson_steps(id),
      answer_json TEXT NOT NULL,
      answered_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, step_id)
    );
    CREATE TABLE ai_feedback_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL REFERENCES lessons(id),
      step_id TEXT NOT NULL REFERENCES lesson_steps(id),
      attempt_number INTEGER NOT NULL,
      idempotency_key TEXT NOT NULL,
      status TEXT NOT NULL,
      answer_text TEXT NOT NULL,
      result_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `)
}
