import { describe, expect, it } from "vitest"

import { createInMemoryWritingAppDatabase } from "@workspace/db/client"

import { runApplicationMigrations } from "@/db/migrate"
import { assertCurrentApplicationSchema } from "@/db/schema-architecture"

const legacyPolicy = {
  normalizeVersionedStepContent(
    _stepId: string,
    _stepType: string,
    contentJson: string
  ) {
    return contentJson
  },
}

describe("legacy curriculum application migration", () => {
  it("상태 모델 이전 attempt와 mutable curriculum을 P11 schema로 보존 이관한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(database.sqlite, 0)
      replaceWithPreStateModelAiFeedbackAttempts(database.sqlite)

      expect(runApplicationMigrations(database.sqlite, legacyPolicy)).toEqual([
        { execution: "adopted", id: "0000-writing-app-baseline" },
        { execution: "applied", id: "0001-module-schema-ownership" },
      ])
      expect(() =>
        assertCurrentApplicationSchema(database.sqlite)
      ).not.toThrow()
      expect(
        database.sqlite
          .query<
            {
              readonly id: string
              readonly revision: number
              readonly status: string
            },
            []
          >(`
            SELECT id, revision, status
            FROM course_curriculum_versions
            ORDER BY revision
          `)
          .all()
      ).toEqual([
        {
          id: "curriculum:course-1:1",
          revision: 1,
          status: "published",
        },
        { id: "curriculum:course-1:2", revision: 2, status: "draft" },
      ])
      expect(
        database.sqlite
          .query<
            {
              readonly attemptId: string
              readonly attemptVersionId: string
              readonly progressVersionId: string
            },
            []
          >(`
            SELECT
              (SELECT id FROM ai_feedback_attempts LIMIT 1) AS attemptId,
              (SELECT curriculum_version_id FROM ai_feedback_attempts LIMIT 1)
                AS attemptVersionId,
              (SELECT curriculum_version_id FROM learner_lesson_progress LIMIT 1)
                AS progressVersionId
          `)
          .get()
      ).toEqual({
        attemptId: "legacy:learner-1:lesson-1:step-2:1",
        attemptVersionId: "curriculum:course-1:1",
        progressVersionId: "curriculum:course-1:1",
      })
      expect(
        database.sqlite
          .query<{ readonly table: string }, []>("PRAGMA foreign_key_check")
          .all()
      ).toEqual([])
    } finally {
      database.close()
    }
  })

  it("legacy normalization 정책이 없으면 mutation 전에 실패한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(database.sqlite, 0)

      expect(() => runApplicationMigrations(database.sqlite)).toThrow(
        "content normalization 정책"
      )
      expect(readColumnNames(database.sqlite, "courses")).toContain(
        "curriculum_revision"
      )
      expect(readTableNames(database.sqlite)).not.toContain(
        "api_schema_migrations"
      )
    } finally {
      database.close()
    }
  })

  it("legacy 검증 실패 시 사전 attempt 보정을 포함한 전체 transaction을 되돌린다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(database.sqlite, 2)
      replaceWithPreStateModelAiFeedbackAttempts(database.sqlite)
      const attemptColumns = readColumnNames(
        database.sqlite,
        "ai_feedback_attempts"
      )

      expect(() =>
        runApplicationMigrations(database.sqlite, legacyPolicy)
      ).toThrow("out-of-range currentStepIndex")
      expect(readColumnNames(database.sqlite, "ai_feedback_attempts")).toEqual(
        attemptColumns
      )
      expect(readColumnNames(database.sqlite, "courses")).toContain(
        "curriculum_revision"
      )
      expect(readTableNames(database.sqlite)).not.toEqual(
        expect.arrayContaining([
          "ai_feedback_attempts_legacy_state",
          "api_schema_migrations",
          "course_curriculum_versions",
        ])
      )
    } finally {
      database.close()
    }
  })
})

function createLegacyCurriculumFixture(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  currentStepIndex: number
): void {
  sqlite.exec(`
    CREATE TABLE user (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    INSERT INTO user VALUES (
      'learner-1', '학습자', 'learner@example.test', 1, NULL, 1, 1
    );

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
      user_id TEXT NOT NULL REFERENCES user(id),
      lesson_id TEXT NOT NULL REFERENCES lessons(id),
      current_step_index INTEGER NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, lesson_id)
    );
    CREATE TABLE learner_lesson_answers (
      user_id TEXT NOT NULL REFERENCES user(id),
      lesson_id TEXT NOT NULL REFERENCES lessons(id),
      step_id TEXT NOT NULL REFERENCES lesson_steps(id),
      answer_json TEXT NOT NULL,
      answered_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, step_id)
    );
    CREATE TABLE ai_feedback_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES user(id),
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

    INSERT INTO courses VALUES (
      'course-1', '코스', '설명', '기초', 'expression', 'active', 1, 4
    );
    INSERT INTO course_units VALUES (
      'unit-1', 'course-1', '유닛', 1, 'active'
    );
    INSERT INTO lessons VALUES (
      'lesson-1', 'course-1', 'unit-1', '레슨', NULL, NULL,
      5, '[]', 1, 'active'
    );
    INSERT INTO lesson_steps VALUES (
      'step-1', 'lesson-1', 'WRITE', 1,
      '{"type":"write","prompt":"쓰기","min":1}', 'active'
    );
    INSERT INTO lesson_steps VALUES (
      'step-2', 'lesson-1', 'AI_FEEDBACK', 2,
      '{"type":"ai_feedback","target":"step-1","focus":"명확성","feedback":"피드백","score":1,"scoreMax":5,"showScore":true,"allowRetry":true}',
      'active'
    );
    INSERT INTO learner_lesson_progress VALUES (
      'learner-1', 'lesson-1', ${currentStepIndex},
      'in_progress', 10, NULL, 20
    );
    INSERT INTO learner_lesson_answers VALUES (
      'learner-1', 'lesson-1', 'step-1', '{"kind":"answer"}', 15, 15
    );
    INSERT INTO ai_feedback_attempts VALUES (
      'attempt-1', 'learner-1', 'lesson-1', 'step-2', 1,
      'key-1', 'succeeded', '답안', NULL, 15, 15, 15
    );
  `)
}

function replaceWithPreStateModelAiFeedbackAttempts(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    DROP TABLE ai_feedback_attempts;
    CREATE TABLE ai_feedback_attempts (
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      step_id TEXT NOT NULL REFERENCES lesson_steps(id) ON DELETE CASCADE,
      attempt_number INTEGER NOT NULL,
      answer_text TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, lesson_id, step_id, attempt_number)
    );
    INSERT INTO ai_feedback_attempts VALUES (
      'learner-1', 'lesson-1', 'step-2', 1, '이전 답안', '{"score":4}', 15
    );
  `)
}

function readColumnNames(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  tableName: string
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
    .all()
    .map((row) => row.name)
}

function readTableNames(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table'"
    )
    .all()
    .map((row) => row.name)
}
