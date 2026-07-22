import { describe, expect, it } from "vitest"

import { createInMemoryWritingAppDatabase } from "#db/client"
import { runBaselineMigration } from "#db/migrations/migrate"

const legacyCurriculumMigrationPolicy = {
  normalizeVersionedStepContent(
    _stepId: string,
    _stepType: string,
    contentJson: string
  ) {
    return contentJson
  },
}

describe("기준 migration", () => {
  it("최종 자료실 트리·문서·자산·검색 schema를 한 번에 만든다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)

      expect(
        readColumnNames(client.sqlite, "admin_resource_documents")
      ).toEqual(["node_id", "content_markdown", "version"])
      expect(readColumnNames(client.sqlite, "admin_resource_assets")).toEqual([
        "id",
        "document_id",
        "r2_object_key",
        "content_type",
        "byte_size",
        "created_at",
      ])
      expect(readObjectNames(client.sqlite)).toEqual(
        expect.arrayContaining([
          "admin_resource_assets",
          "admin_resource_documents",
          "admin_resource_nodes",
          "admin_resource_search",
        ])
      )
      expect(readObjectNames(client.sqlite)).not.toEqual(
        expect.arrayContaining([
          "admin_resource_audit_events",
          "admin_resource_collaboration",
          "admin_resource_tree_state",
        ])
      )
      expect(
        client.sqlite
          .query<{ readonly integrity_check: string }, []>(
            "PRAGMA integrity_check"
          )
          .get()
      ).toEqual({ integrity_check: "ok" })
    } finally {
      client.close()
    }
  })

  it("기존 관리자 인증 schema에서 MFA column과 table을 제거한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      client.sqlite.exec(`
        CREATE TABLE admin_user (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          email_verified INTEGER NOT NULL,
          image TEXT,
          role TEXT NOT NULL DEFAULT 'operator',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `)

      client.sqlite.exec(`
        ALTER TABLE admin_user ADD COLUMN two_factor_enabled INTEGER NOT NULL DEFAULT 0;
        CREATE TABLE admin_two_factor (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          secret TEXT NOT NULL,
          backup_codes TEXT NOT NULL,
          verified INTEGER NOT NULL DEFAULT 0,
          failed_verification_count INTEGER NOT NULL DEFAULT 0,
          locked_until INTEGER
        );
        CREATE TABLE admin_mfa_recovery_code (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          code_hash TEXT NOT NULL UNIQUE,
          created_at INTEGER NOT NULL,
          used_at INTEGER
        );
      `)

      runBaselineMigration(client.sqlite)

      expect(readColumnNames(client.sqlite, "admin_user")).not.toContain(
        "two_factor_enabled"
      )
      expect(readObjectNames(client.sqlite)).not.toEqual(
        expect.arrayContaining(["admin_mfa_recovery_code", "admin_two_factor"])
      )
      expect(
        client.sqlite
          .query<{ readonly integrity_check: string }, []>(
            "PRAGMA integrity_check"
          )
          .get()
      ).toEqual({ integrity_check: "ok" })
      expect(
        client.sqlite
          .query<{ readonly table: string }, []>("PRAGMA foreign_key_check")
          .all()
      ).toEqual([])
    } finally {
      client.close()
    }
  })

  it("기존 mutable 커리큘럼과 progress를 revision 1 published와 다음 draft로 변환한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(client.sqlite, 0)

      runBaselineMigration(client.sqlite, legacyCurriculumMigrationPolicy)

      expect(readColumnNames(client.sqlite, "courses")).toEqual([
        "id",
        "status",
        "sort_order",
        "published_curriculum_version_id",
        "created_at",
      ])
      expect(
        client.sqlite
          .query<
            {
              readonly editVersion: number
              readonly id: string
              readonly revision: number
              readonly status: string
            },
            []
          >(`
            SELECT id, revision, edit_version AS editVersion, status
            FROM course_curriculum_versions
            ORDER BY revision
          `)
          .all()
      ).toEqual([
        {
          editVersion: 0,
          id: "curriculum:course-1:1",
          revision: 1,
          status: "published",
        },
        {
          editVersion: 0,
          id: "curriculum:course-1:2",
          revision: 2,
          status: "draft",
        },
      ])
      expect(
        client.sqlite
          .query<
            {
              readonly currentStepId: string
              readonly curriculumVersionId: string
            },
            []
          >(`
            SELECT current_step_id AS currentStepId,
                   curriculum_version_id AS curriculumVersionId
            FROM learner_lesson_progress
          `)
          .get()
      ).toEqual({
        currentStepId: "step-1",
        curriculumVersionId: "curriculum:course-1:1",
      })
      expect(
        client.sqlite
          .query<
            {
              readonly answerVersionId: string
              readonly attemptVersionId: string
            },
            []
          >(`
            SELECT answers.curriculum_version_id AS answerVersionId,
                   attempts.curriculum_version_id AS attemptVersionId
            FROM learner_lesson_answers answers
            JOIN ai_feedback_attempts attempts
              ON attempts.user_id = answers.user_id
          `)
          .get()
      ).toEqual({
        answerVersionId: "curriculum:course-1:1",
        attemptVersionId: "curriculum:course-1:1",
      })
      expect(
        client.sqlite
          .query<{ readonly table: string }, []>("PRAGMA foreign_key_check")
          .all()
      ).toEqual([])
    } finally {
      client.close()
    }
  })

  it("기존 커리큘럼 migration은 content 정규화 정책 주입 없이는 실패한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(client.sqlite, 0)

      expect(() => runBaselineMigration(client.sqlite)).toThrow(
        "Legacy curriculum migration requires a content normalization policy"
      )
      expect(readColumnNames(client.sqlite, "courses")).toContain(
        "curriculum_revision"
      )
    } finally {
      client.close()
    }
  })

  it("상태 모델 이전의 AI feedback attempt를 결정적으로 보정해 보존한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(client.sqlite, 0)
      replaceWithPreStateModelAiFeedbackAttempts(client.sqlite)

      runBaselineMigration(client.sqlite, legacyCurriculumMigrationPolicy)

      expect(
        client.sqlite
          .query<
            {
              readonly answerText: string
              readonly courseId: string
              readonly createdAt: number
              readonly curriculumVersionId: string
              readonly expiresAt: number
              readonly id: string
              readonly idempotencyKey: string
              readonly resultJson: string | null
              readonly status: string
              readonly updatedAt: number
            },
            []
          >(
            `
              SELECT id,
                     course_id AS courseId,
                     curriculum_version_id AS curriculumVersionId,
                     idempotency_key AS idempotencyKey,
                     status,
                     answer_text AS answerText,
                     result_json AS resultJson,
                     created_at AS createdAt,
                     updated_at AS updatedAt,
                     expires_at AS expiresAt
              FROM ai_feedback_attempts
            `
          )
          .get()
      ).toEqual({
        answerText: "이전 답안",
        courseId: "course-1",
        createdAt: 15,
        curriculumVersionId: "curriculum:course-1:1",
        expiresAt: 15,
        id: "legacy:learner-1:lesson-1:step-2:1",
        idempotencyKey: "legacy:1",
        resultJson: '{"score":4}',
        status: "succeeded",
        updatedAt: 15,
      })
      expect(readIndexNames(client.sqlite, "ai_feedback_attempts")).toEqual(
        expect.arrayContaining([
          "ai_feedback_attempts_active_slot_idx",
          "ai_feedback_attempts_expiry_idx",
          "ai_feedback_attempts_idempotency_idx",
          "ai_feedback_attempts_pending_idx",
        ])
      )
      expect(
        client.sqlite
          .query<{ readonly integrity_check: string }, []>(
            "PRAGMA integrity_check"
          )
          .get()
      ).toEqual({ integrity_check: "ok" })
      expect(
        client.sqlite
          .query<{ readonly table: string }, []>("PRAGMA foreign_key_check")
          .all()
      ).toEqual([])
    } finally {
      client.close()
    }
  })

  it("범위를 벗어난 progress가 있으면 기존 schema를 유지하고 migration을 실패시킨다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      createLegacyCurriculumFixture(client.sqlite, 2)

      expect(() =>
        runBaselineMigration(client.sqlite, legacyCurriculumMigrationPolicy)
      ).toThrow("out-of-range currentStepIndex")
      expect(readColumnNames(client.sqlite, "courses")).toContain(
        "curriculum_revision"
      )
      expect(readObjectNames(client.sqlite)).not.toContain(
        "course_curriculum_versions"
      )
    } finally {
      client.close()
    }
  })

  it("새 baseline과 기존 DB migration이 같은 커리큘럼 schema를 만든다", () => {
    const baselineClient = createInMemoryWritingAppDatabase()
    const migratedClient = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(baselineClient.sqlite)
      createLegacyCurriculumFixture(migratedClient.sqlite, 0)
      runBaselineMigration(
        migratedClient.sqlite,
        legacyCurriculumMigrationPolicy
      )

      expect(readCurriculumSchema(migratedClient.sqlite)).toEqual(
        readCurriculumSchema(baselineClient.sqlite)
      )
    } finally {
      migratedClient.close()
      baselineClient.close()
    }
  })

  it("course당 draft 하나만 허용하고 published 콘텐츠 변경을 거부한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)
      seedVersionedCurriculum(client)

      expect(() =>
        client.sqlite
          .query(`
            INSERT INTO course_curriculum_versions (
              id, course_id, revision, edit_version, status, title,
              description, category, visual_key, created_at, updated_at, published_at
            ) VALUES (
              'curriculum:course-1:3', 'course-1', 3, 0, 'draft', '코스',
              '설명', '기초', 'basic-sentence-writing', 0, 0, NULL
            )
          `)
          .run()
      ).toThrow(/UNIQUE constraint failed/)
      expect(() =>
        client.sqlite
          .query(`
            UPDATE lesson_step_versions
            SET content_json = '{"body":"변경"}'
            WHERE curriculum_version_id = 'curriculum:course-1:1'
              AND id = 'step-1'
          `)
          .run()
      ).toThrow("published curriculum content is immutable")
    } finally {
      client.close()
    }
  })
})

function createLegacyCurriculumFixture(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  currentStepIndex: number
): void {
  sqlite.exec(`
CREATE TABLE user (id TEXT PRIMARY KEY NOT NULL);
INSERT INTO user (id) VALUES ('learner-1');

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
  'course-1', '코스', '설명', '기초', 'basic-sentence-writing', 'active', 1, 4
);
INSERT INTO course_units VALUES ('unit-1', 'course-1', '유닛', 1, 'active');
INSERT INTO lessons VALUES (
  'lesson-1', 'course-1', 'unit-1', '레슨', NULL, NULL, 5, '[]', 1, 'active'
);
INSERT INTO lesson_steps VALUES (
  'step-1', 'lesson-1', 'WRITE', 1,
  '{"type":"write","prompt":"쓰기","min":1}',
  'active'
);
INSERT INTO lesson_steps VALUES (
  'step-2', 'lesson-1', 'AI_FEEDBACK', 2,
  '{"type":"ai_feedback","target":"step-1","focus":"명확성","feedback":"피드백","score":1,"scoreMax":5,"showScore":true,"allowRetry":true}',
  'active'
);
INSERT INTO learner_lesson_progress VALUES (
  'learner-1', 'lesson-1', ${currentStepIndex}, 'in_progress', 10, NULL, 20
);
INSERT INTO learner_lesson_answers VALUES (
  'learner-1', 'lesson-1', 'step-1', '{"kind":"answer"}', 15, 15
);
INSERT INTO ai_feedback_attempts VALUES (
  'attempt-1', 'learner-1', 'lesson-1', 'step-2', 1, 'key-1', 'succeeded',
  '답안', NULL, 15, 15, 15
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

function seedVersionedCurriculum(
  client: ReturnType<typeof createInMemoryWritingAppDatabase>
): void {
  client.sqlite.exec(`
INSERT INTO courses VALUES ('course-1', 'active', 1, NULL, 0);
INSERT INTO course_curriculum_versions VALUES (
  'curriculum:course-1:1', 'course-1', 1, 0, 'draft',
  '코스', '설명', '기초', 'basic-sentence-writing', 0, 0, NULL
);
INSERT INTO course_unit_versions VALUES (
  'curriculum:course-1:1', 'unit-1', '유닛', 1, 'active'
);
INSERT INTO lesson_versions VALUES (
  'curriculum:course-1:1', 'lesson-1', 'unit-1', '레슨', NULL, NULL,
  5, '[]', 1, 'active'
);
INSERT INTO lesson_step_versions VALUES (
  'curriculum:course-1:1', 'step-1', 'lesson-1', 'READING', 1,
  '{"body":"본문"}', 'active'
);
UPDATE course_curriculum_versions
SET status = 'published', published_at = 1, updated_at = 1
WHERE id = 'curriculum:course-1:1';
UPDATE courses
SET published_curriculum_version_id = 'curriculum:course-1:1'
WHERE id = 'course-1';
INSERT INTO course_curriculum_versions VALUES (
  'curriculum:course-1:2', 'course-1', 2, 0, 'draft',
  '코스', '설명', '기초', 'basic-sentence-writing', 1, 1, NULL
);
`)
}

function readCurriculumSchema(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
) {
  const ownedNames = [
    "ai_feedback_attempts",
    "course_curriculum_versions",
    "course_unit_versions",
    "courses",
    "learner_course_progress",
    "learner_lesson_answers",
    "learner_lesson_progress",
    "lesson_step_versions",
    "lesson_versions",
  ] as const

  return sqlite
    .query<
      {
        readonly name: string
        readonly sql: string | null
        readonly type: string
      },
      [string, string, string, string, string, string, string, string, string]
    >(`
      SELECT name, type, sql
      FROM sqlite_master
      WHERE tbl_name IN (?, ?, ?, ?, ?, ?, ?, ?, ?)
        AND name NOT LIKE 'sqlite_%'
      ORDER BY type, name
    `)
    .all(...ownedNames)
}

function readColumnNames(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  tableName: string
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(`PRAGMA table_info(${tableName})`)
    .all()
    .map(({ name }) => name)
}

function readIndexNames(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  tableName: string
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(`PRAGMA index_list(${tableName})`)
    .all()
    .map(({ name }) => name)
}

function readObjectNames(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type IN ('table', 'view')"
    )
    .all()
    .map(({ name }) => name)
}
