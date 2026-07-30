import type { PublishedCourseFixture } from "@workspace/content/test-fixtures"
import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

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
