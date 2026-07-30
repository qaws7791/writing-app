import type { PublishedCourseFixture } from "@workspace/content/test-fixtures"
import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

export function ensurePurgeTestSchema(sqlite: WritingAppSqlite): void {
  addAiFeedbackAttemptColumn(sqlite, "input_token_count", "INTEGER")
  addAiFeedbackAttemptColumn(sqlite, "latency_ms", "INTEGER")
  addAiFeedbackAttemptColumn(sqlite, "model", "TEXT NOT NULL DEFAULT 'legacy'")
  addAiFeedbackAttemptColumn(sqlite, "output_token_count", "INTEGER")
  addAiFeedbackAttemptColumn(
    sqlite,
    "prompt_policy_version",
    "TEXT NOT NULL DEFAULT 'legacy'"
  )
  addAiFeedbackAttemptColumn(
    sqlite,
    "quota_date",
    "TEXT NOT NULL DEFAULT '1970-01-01'"
  )
  addAiFeedbackAttemptColumn(sqlite, "failure_code", "TEXT")

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS learner_step_drafts (
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      curriculum_version_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      step_id TEXT NOT NULL,
      answer_json TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (
        user_id, course_id, curriculum_version_id, lesson_id, step_id
      ),
      FOREIGN KEY (user_id, course_id, curriculum_version_id)
        REFERENCES learner_course_progress(
          user_id, course_id, curriculum_version_id
        ) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS ai_feedback_user_daily_counters (
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE RESTRICT,
      quota_date TEXT NOT NULL,
      request_count INTEGER NOT NULL,
      success_count INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, quota_date)
    );
    CREATE TABLE IF NOT EXISTS ai_feedback_global_daily_counters (
      quota_date TEXT PRIMARY KEY NOT NULL,
      request_count INTEGER NOT NULL,
      success_count INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `)
}

export type AiFeedbackAttemptFixtureInput = Readonly<{
  attemptId: string
  course: PublishedCourseFixture
  failureCode?: string | null
  idempotencyKey: string
  quotaDate?: string
  userId: string
}>

export function aAiFeedbackAttempt(
  sqlite: WritingAppSqlite,
  input: AiFeedbackAttemptFixtureInput
): void {
  const quotaDate = input.quotaDate ?? "2026-07-19"
  sqlite
    .query<
      void,
      [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string | null,
      ]
    >(
      `INSERT INTO ai_feedback_attempts (
        id, user_id, course_id, curriculum_version_id, lesson_id, step_id,
        attempt_number, idempotency_key, status, answer_text, result_json,
        created_at, updated_at, expires_at, input_token_count, latency_ms,
        model, output_token_count, prompt_policy_version, quota_date,
        failure_code
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, 'failed', 'answer', NULL, 1, 1, 2,
        NULL, 1, 'gpt-test', NULL, 'writing-coach-v1', ?8, ?9
      )`
    )
    .run(
      input.attemptId,
      input.userId,
      input.course.courseId,
      input.course.curriculumVersionId,
      input.course.lessonId,
      input.course.stepId,
      input.idempotencyKey,
      quotaDate,
      input.failureCode ?? "provider-unavailable"
    )

  sqlite
    .query<void, [string, string]>(
      `INSERT INTO ai_feedback_user_daily_counters (
        user_id, quota_date, request_count, success_count, updated_at
      ) VALUES (?1, ?2, 1, 0, 1)`
    )
    .run(input.userId, quotaDate)
}

export function aAiFeedbackGlobalDailyCounter(
  sqlite: WritingAppSqlite,
  quotaDate: string
): void {
  sqlite
    .query<void, [string]>(
      `INSERT INTO ai_feedback_global_daily_counters (
        quota_date, request_count, success_count, updated_at
      ) VALUES (?1, 2, 0, 1)`
    )
    .run(quotaDate)
}

function addAiFeedbackAttemptColumn(
  sqlite: WritingAppSqlite,
  column: string,
  definition: string
): void {
  const columns = sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM pragma_table_info('ai_feedback_attempts')"
    )
    .all()
  if (columns.some(({ name }) => name === column)) return

  sqlite.exec(
    `ALTER TABLE ai_feedback_attempts ADD COLUMN ${column} ${definition}`
  )
}
