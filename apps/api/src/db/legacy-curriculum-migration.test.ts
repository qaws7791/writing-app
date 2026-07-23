import { describe, expect, it } from "vitest"

import { normalizeLegacyVersionedStepContentOrThrow } from "@workspace/content/normalization"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"

import { runApplicationMigrations } from "@/db/migrate"
import { assertCurrentApplicationSchema } from "@/db/schema-architecture"
import { inspectApplicationDatabase } from "@/db/schema-diagnostic"

const legacyPolicy = {
  normalizeVersionedStepContent: normalizeLegacyVersionedStepContentOrThrow,
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
              readonly targetStepId: string
            },
            []
          >(`
            SELECT
              (SELECT id FROM ai_feedback_attempts LIMIT 1) AS attemptId,
              (SELECT curriculum_version_id FROM ai_feedback_attempts LIMIT 1)
                AS attemptVersionId,
              (SELECT curriculum_version_id FROM learner_lesson_progress LIMIT 1)
                AS progressVersionId,
              (SELECT json_extract(content_json, '$.target')
               FROM lesson_step_versions
               WHERE curriculum_version_id = 'curriculum:course-1:1'
                 AND id = 'step-2') AS targetStepId
          `)
          .get()
      ).toEqual({
        attemptId: "legacy:learner-1:lesson-1:step-2:1",
        attemptVersionId: "curriculum:course-1:1",
        progressVersionId: "curriculum:course-1:1",
        targetStepId: "step-1",
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

  it("archived curriculum 전체 계층과 학습자 참조를 두 revision에 보존한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(database.sqlite, 0)
      addArchivedCurriculumFixture(database.sqlite)
      addReferenceOnlyLearners(database.sqlite)

      expect(inspectApplicationDatabase(database.sqlite)).toMatchObject({
        issues: [],
        legacySchema: "curriculum",
        schema: "legacy",
        status: "migration-required",
      })
      runApplicationMigrations(database.sqlite, legacyPolicy)

      expect(
        database.sqlite
          .query<
            {
              readonly courseId: string
              readonly revision: number
              readonly status: string
            },
            []
          >(`
            SELECT course_id AS courseId, revision, status
            FROM course_curriculum_versions
            ORDER BY course_id, revision
          `)
          .all()
      ).toEqual([
        { courseId: "course-1", revision: 1, status: "published" },
        { courseId: "course-1", revision: 2, status: "draft" },
        { courseId: "course-archived", revision: 1, status: "published" },
        { courseId: "course-archived", revision: 2, status: "draft" },
      ])
      expect(
        database.sqlite
          .query<
            {
              readonly curriculumVersionId: string
              readonly id: string
              readonly kind: string
              readonly status: string
            },
            []
          >(`
            SELECT curriculum_version_id AS curriculumVersionId, id,
                   'unit' AS kind, status
            FROM course_unit_versions
            WHERE id = 'unit-archived'
            UNION ALL
            SELECT curriculum_version_id, id, 'lesson', status
            FROM lesson_versions
            WHERE id = 'lesson-archived'
            UNION ALL
            SELECT curriculum_version_id, id, 'step', status
            FROM lesson_step_versions
            WHERE id IN ('step-archived-write', 'step-archived-feedback')
            ORDER BY curriculumVersionId, kind, id
          `)
          .all()
      ).toEqual([
        {
          curriculumVersionId: "curriculum:course-archived:1",
          id: "lesson-archived",
          kind: "lesson",
          status: "archived",
        },
        {
          curriculumVersionId: "curriculum:course-archived:1",
          id: "step-archived-feedback",
          kind: "step",
          status: "archived",
        },
        {
          curriculumVersionId: "curriculum:course-archived:1",
          id: "step-archived-write",
          kind: "step",
          status: "archived",
        },
        {
          curriculumVersionId: "curriculum:course-archived:1",
          id: "unit-archived",
          kind: "unit",
          status: "archived",
        },
        {
          curriculumVersionId: "curriculum:course-archived:2",
          id: "lesson-archived",
          kind: "lesson",
          status: "archived",
        },
        {
          curriculumVersionId: "curriculum:course-archived:2",
          id: "step-archived-feedback",
          kind: "step",
          status: "archived",
        },
        {
          curriculumVersionId: "curriculum:course-archived:2",
          id: "step-archived-write",
          kind: "step",
          status: "archived",
        },
        {
          curriculumVersionId: "curriculum:course-archived:2",
          id: "unit-archived",
          kind: "unit",
          status: "archived",
        },
      ])
      expect(
        database.sqlite
          .query<
            {
              readonly contentJson: string
              readonly curriculumVersionId: string
            },
            []
          >(`
            SELECT curriculum_version_id AS curriculumVersionId,
                   content_json AS contentJson
            FROM lesson_step_versions
            WHERE id = 'step-archived-reading'
            ORDER BY curriculum_version_id
          `)
          .all()
          .map(({ contentJson, ...row }) => ({
            ...row,
            content: JSON.parse(contentJson),
          }))
      ).toEqual([
        {
          content: {
            body: "보관 본문",
            guide: "",
            title: "보관 읽기",
            type: "reading",
          },
          curriculumVersionId: "curriculum:course-archived:1",
        },
        {
          content: {
            body: "보관 본문",
            guide: "",
            title: "보관 읽기",
            type: "reading",
          },
          curriculumVersionId: "curriculum:course-archived:2",
        },
      ])
      expect(
        database.sqlite
          .query<
            {
              readonly answerVersionId: string
              readonly attemptVersionId: string
              readonly currentStepId: string
              readonly progressVersionId: string
            },
            []
          >(`
            SELECT
              (SELECT curriculum_version_id
               FROM learner_lesson_answers
               WHERE lesson_id = 'lesson-archived') AS answerVersionId,
              (SELECT curriculum_version_id
               FROM ai_feedback_attempts
               WHERE lesson_id = 'lesson-archived') AS attemptVersionId,
              (SELECT current_step_id
               FROM learner_lesson_progress
               WHERE lesson_id = 'lesson-archived') AS currentStepId,
              (SELECT curriculum_version_id
               FROM learner_lesson_progress
               WHERE lesson_id = 'lesson-archived') AS progressVersionId
          `)
          .get()
      ).toEqual({
        answerVersionId: "curriculum:course-archived:1",
        attemptVersionId: "curriculum:course-archived:1",
        currentStepId: "step-archived-write",
        progressVersionId: "curriculum:course-archived:1",
      })
      expect(
        database.sqlite
          .query<
            {
              readonly completedAt: number | null
              readonly status: string
            },
            []
          >(`
            SELECT completed_at AS completedAt, status
            FROM learner_course_progress
            WHERE user_id = 'learner-1'
              AND course_id = 'course-archived'
          `)
          .get()
      ).toEqual({
        completedAt: null,
        status: "in_progress",
      })
      expect(
        database.sqlite
          .query<
            {
              readonly curriculumVersionId: string
              readonly status: string
              readonly userId: string
            },
            []
          >(`
            SELECT user_id AS userId,
                   curriculum_version_id AS curriculumVersionId, status
            FROM learner_course_progress
            WHERE user_id IN ('learner-answer-only', 'learner-attempt-only')
            ORDER BY user_id
          `)
          .all()
      ).toEqual([
        {
          curriculumVersionId: "curriculum:course-1:1",
          status: "in_progress",
          userId: "learner-answer-only",
        },
        {
          curriculumVersionId: "curriculum:course-1:1",
          status: "in_progress",
          userId: "learner-attempt-only",
        },
      ])
      expect(
        database.sqlite
          .query<{ readonly id: string }, []>(
            "SELECT id FROM courses WHERE status = 'active' ORDER BY id"
          )
          .all()
      ).toEqual([{ id: "course-1" }])
      expect(runApplicationMigrations(database.sqlite, legacyPolicy)).toEqual([
        { execution: "skipped", id: "0000-writing-app-baseline" },
        { execution: "skipped", id: "0001-module-schema-ownership" },
      ])
      expect(
        database.sqlite
          .query<{ readonly table: string }, []>("PRAGMA foreign_key_check")
          .all()
      ).toEqual([])
    } finally {
      database.close()
    }
  })

  it("active course의 active 경로가 비어 있으면 원본을 변경하지 않고 실패한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(database.sqlite, 0)
      database.sqlite.exec(
        "UPDATE course_units SET status = 'archived' WHERE id = 'unit-1'"
      )

      expect(() =>
        runApplicationMigrations(database.sqlite, legacyPolicy)
      ).toThrow("course course-1 has no active children")
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

  it("lesson의 course와 unit 소유권이 다르면 transaction 전에 fail-closed한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(database.sqlite, 0)
      database.sqlite.exec(`
        INSERT INTO courses VALUES (
          'course-2', '다른 코스', '설명', '기초',
          'expression', 'archived', 2, 1
        );
        UPDATE lessons SET course_id = 'course-2' WHERE id = 'lesson-1';
      `)

      expect(() =>
        runApplicationMigrations(database.sqlite, legacyPolicy)
      ).toThrow(
        "lesson lesson-1 course course-2 does not match course unit unit-1"
      )
      expect(
        database.sqlite
          .query<{ readonly courseId: string }, []>(
            "SELECT course_id AS courseId FROM lessons WHERE id = 'lesson-1'"
          )
          .get()
      ).toEqual({ courseId: "course-2" })
      expect(readTableNames(database.sqlite)).not.toContain(
        "api_schema_migrations"
      )
    } finally {
      database.close()
    }
  })

  it.each([
    {
      expected: "no preceding WRITE",
      prepare(
        sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
      ) {
        sqlite.exec(`
          UPDATE lesson_steps
          SET type = 'READING',
              content_json = '{"type":"reading","title":"읽기","guide":"안내","body":"본문"}'
          WHERE id = 'step-1'
        `)
      },
    },
    {
      expected: "sortOrder is not contiguous",
      prepare(
        sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
      ) {
        sqlite.exec(
          "UPDATE lesson_steps SET sort_order = 1 WHERE id = 'step-3'"
        )
      },
    },
  ])(
    "legacy AI target의 선행 WRITE sequence가 $expected이면 fail-closed한다",
    ({ expected, prepare }) => {
      const database = createInMemoryWritingAppDatabase()

      try {
        createLegacyCurriculumFixture(database.sqlite, 0)
        prepare(database.sqlite)

        expect(() =>
          runApplicationMigrations(database.sqlite, legacyPolicy)
        ).toThrow(expected)
        expect(readColumnNames(database.sqlite, "courses")).toContain(
          "curriculum_revision"
        )
        expect(readTableNames(database.sqlite)).not.toContain(
          "course_curriculum_versions"
        )
      } finally {
        database.close()
      }
    }
  )

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

  it("legacy DB의 migration history가 변조되면 curriculum mutation 전에 실패한다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(database.sqlite, 0)
      database.sqlite.exec(`
        CREATE TABLE api_schema_migrations (
          id TEXT PRIMARY KEY NOT NULL,
          checksum TEXT NOT NULL,
          execution TEXT NOT NULL,
          applied_at INTEGER NOT NULL
        );
        INSERT INTO api_schema_migrations
        VALUES ('9999-unknown', '${"f".repeat(64)}', 'applied', 1);
      `)

      expect(() =>
        runApplicationMigrations(database.sqlite, legacyPolicy)
      ).toThrow("알 수 없는 적용 migration")
      expect(readColumnNames(database.sqlite, "courses")).toContain(
        "curriculum_revision"
      )
      expect(readTableNames(database.sqlite)).not.toContain(
        "course_curriculum_versions"
      )
    } finally {
      database.close()
    }
  })

  it("legacy 검증 실패 시 사전 attempt 보정을 포함한 전체 transaction을 되돌린다", () => {
    const database = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(database.sqlite, 3)
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
      '{"type":"ai_feedback","target":"wr","focus":"명확성","feedback":"피드백","score":1,"scoreMax":5,"showScore":true,"allowRetry":true}',
      'active'
    );
    INSERT INTO lesson_steps VALUES (
      'step-3', 'lesson-1', 'WRITE', 3,
      '{"type":"write","prompt":"후속 쓰기","min":1}', 'active'
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

function addArchivedCurriculumFixture(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    INSERT INTO courses VALUES (
      'course-archived', '보관 코스', '보관 설명', '기초',
      'expression', 'archived', 2, 3
    );
    INSERT INTO course_units VALUES (
      'unit-archived', 'course-archived', '보관 유닛', 1, 'archived'
    );
    INSERT INTO lessons VALUES (
      'lesson-archived', 'course-archived', 'unit-archived',
      '보관 레슨', NULL, NULL, 5, '[]', 1, 'archived'
    );
    INSERT INTO lesson_steps VALUES (
      'step-archived-write', 'lesson-archived', 'WRITE', 1,
      '{"type":"write","prompt":"보관 쓰기","min":1}', 'archived'
    );
    INSERT INTO lesson_steps VALUES (
      'step-archived-feedback', 'lesson-archived', 'AI_FEEDBACK', 2,
      '{"type":"ai_feedback","target":"step-archived-write","focus":"명확성","feedback":"피드백","score":1,"scoreMax":5,"showScore":true,"allowRetry":true}',
      'archived'
    );
    INSERT INTO lesson_steps VALUES (
      'step-archived-reading', 'lesson-archived', 'READING', 3,
      '{"type":"reading","title":"보관 읽기","body":"보관 본문"}',
      'archived'
    );
    INSERT INTO learner_lesson_progress VALUES (
      'learner-1', 'lesson-archived', 0,
      'in_progress', 30, NULL, 40
    );
    INSERT INTO learner_lesson_answers VALUES (
      'learner-1', 'lesson-archived', 'step-archived-write',
      '{"kind":"archived-answer"}', 35, 35
    );
    INSERT INTO ai_feedback_attempts VALUES (
      'attempt-archived', 'learner-1', 'lesson-archived',
      'step-archived-feedback', 1, 'key-archived', 'succeeded',
      '보관 답안', NULL, 35, 35, 35
    );
  `)
}

function addReferenceOnlyLearners(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    INSERT INTO user VALUES
      ('learner-answer-only', '답변 학습자', 'answer@example.test', 1, NULL, 1, 1),
      ('learner-attempt-only', '시도 학습자', 'attempt@example.test', 1, NULL, 1, 1);
    INSERT INTO learner_lesson_answers VALUES (
      'learner-answer-only', 'lesson-1', 'step-1',
      '{"kind":"answer-only"}', 50, 50
    );
    INSERT INTO ai_feedback_attempts VALUES (
      'attempt-only', 'learner-attempt-only', 'lesson-1', 'step-2', 1,
      'key-attempt-only', 'succeeded', '답안', NULL, 60, 60, 60
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
