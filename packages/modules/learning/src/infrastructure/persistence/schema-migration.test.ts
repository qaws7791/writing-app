import { describe, expect, it } from "vitest"

import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

import { runLearningSchemaMigration } from "#learning/infrastructure/persistence/schema-migration"

describe("learning schema migration", () => {
  it("cross-module FK를 제거하고 module 내부 FK와 index만 유지하며 재실행 가능하다", () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runBaselineMigration(database.sqlite)
      runLearningSchemaMigration(database.sqlite)
      runLearningSchemaMigration(database.sqlite)

      const courseForeignKeys = readForeignKeyTables(
        database.sqlite,
        "learner_course_progress"
      )
      const lessonForeignKeys = readForeignKeyTables(
        database.sqlite,
        "learner_lesson_progress"
      )
      const answerForeignKeys = readForeignKeyTables(
        database.sqlite,
        "learner_lesson_answers"
      )
      const indexes = database.sqlite
        .query<{ readonly name: string }, []>(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'learner_%'"
        )
        .all()
        .map((row) => row.name)

      expect(courseForeignKeys).toEqual([])
      expect(lessonForeignKeys).toEqual(["learner_course_progress"])
      expect(answerForeignKeys).toEqual(["learner_course_progress"])
      expect(indexes).toEqual(
        expect.arrayContaining([
          "learner_course_progress_version_scope_idx",
          "learner_course_progress_activity_idx",
          "learner_lesson_progress_user_course_idx",
          "learner_lesson_answers_lesson_idx",
        ])
      )
    } finally {
      database.close()
    }
  })

  it("기존 learning row를 보존하면서 FK 소유권만 전환한다", () => {
    const database = createInMemoryWritingAppDatabase()
    try {
      runBaselineMigration(database.sqlite)
      database.sqlite.exec("PRAGMA foreign_keys = OFF")
      database.sqlite.exec(`
        INSERT INTO learner_activity_days (
          user_id, activity_date, completed_lessons, first_activity_at,
          last_activity_at, saved_answers
        ) VALUES ('learner-1', '2026-07-23', 1, 1000, 2000, 1);

        INSERT INTO learner_course_progress (
          user_id, course_id, curriculum_version_id, status, started_at,
          last_activity_at, completed_at, updated_at
        ) VALUES (
          'learner-1', 'course-1', 'curriculum-1', 'completed',
          1000, 2000, 2000, 2000
        );

        INSERT INTO learner_lesson_progress (
          user_id, course_id, curriculum_version_id, lesson_id,
          current_step_id, status, started_at, completed_at, updated_at
        ) VALUES (
          'learner-1', 'course-1', 'curriculum-1', 'lesson-1',
          'step-1', 'completed', 1000, 2000, 2000
        );

        INSERT INTO learner_lesson_answers (
          user_id, course_id, curriculum_version_id, lesson_id, step_id,
          answer_json, answered_at, updated_at
        ) VALUES (
          'learner-1', 'course-1', 'curriculum-1', 'lesson-1', 'step-1',
          '{"kind":"acknowledge"}', 1500, 1500
        );
      `)
      database.sqlite.exec("PRAGMA foreign_keys = ON")

      runLearningSchemaMigration(database.sqlite)

      expect(
        database.sqlite
          .query<
            {
              readonly activityDate: string
              readonly completedLessons: number
              readonly savedAnswers: number
              readonly userId: string
            },
            []
          >(`
            SELECT
              user_id AS userId,
              activity_date AS activityDate,
              completed_lessons AS completedLessons,
              saved_answers AS savedAnswers
            FROM learner_activity_days
          `)
          .all()
      ).toEqual([
        {
          activityDate: "2026-07-23",
          completedLessons: 1,
          savedAnswers: 1,
          userId: "learner-1",
        },
      ])
      expect(
        database.sqlite
          .query<{ readonly value: number }, []>(
            "SELECT COUNT(*) AS value FROM learner_course_progress"
          )
          .get()?.value
      ).toBe(1)
      expect(
        database.sqlite
          .query<{ readonly value: number }, []>(
            "SELECT COUNT(*) AS value FROM learner_lesson_progress"
          )
          .get()?.value
      ).toBe(1)
      expect(
        database.sqlite
          .query<{ readonly value: number }, []>(
            "SELECT COUNT(*) AS value FROM learner_lesson_answers"
          )
          .get()?.value
      ).toBe(1)
    } finally {
      database.close()
    }
  })
})

function readForeignKeyTables(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  table: string
): readonly string[] {
  return [
    ...new Set(
      sqlite
        .query<{ readonly table: string }, []>(
          `PRAGMA foreign_key_list(${table})`
        )
        .all()
        .map((row) => row.table)
    ),
  ].sort()
}
