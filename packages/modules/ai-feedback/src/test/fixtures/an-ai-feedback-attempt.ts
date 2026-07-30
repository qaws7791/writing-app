import type { PublishedCourseFixture } from "@workspace/content/test-fixtures"
import type { WritingAppSqlite } from "@workspace/db/test-support/sqlite-types"

export type AiFeedbackAttemptFixtureInput = Readonly<{
  answerText?: string
  attemptId: string
  attemptNumber?: number
  course: PublishedCourseFixture
  createdAt?: number
  failureCode?: string | null
  idempotencyKey: string
  inputTokenCount?: number | null
  latencyMs?: number | null
  lessonId?: string
  outputTokenCount?: number | null
  quotaDate?: string
  resultJson?: string | null
  status?: "failed" | "succeeded"
  stepId?: string
  userId: string
}>

export function aAiFeedbackAttempt(
  sqlite: WritingAppSqlite,
  input: AiFeedbackAttemptFixtureInput
): void {
  const {
    answerText = "answer",
    attemptNumber = 1,
    course,
    createdAt = 1,
    inputTokenCount = null,
    latencyMs = 1,
    lessonId = course.lessonId,
    outputTokenCount = null,
    quotaDate = "2026-07-19",
    resultJson = null,
    status = "failed",
    stepId = course.stepId,
    userId,
  } = input
  const failureCode =
    input.failureCode === undefined
      ? status === "succeeded"
        ? null
        : "provider-unavailable"
      : input.failureCode

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
        number,
        string,
        "failed" | "succeeded",
        string,
        string | null,
        number,
        string,
        number | null,
        number | null,
        number | null,
        string | null,
      ]
    >(
      `INSERT INTO ai_feedback_attempts (
        id, user_id, course_id, curriculum_version_id, lesson_id, step_id,
        attempt_number, idempotency_key, status, answer_text, failure_code,
        created_at, updated_at, expires_at, quota_date, input_token_count,
        latency_ms, output_token_count, result_json, model,
        prompt_policy_version
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?12, ?12 + 1, ?13,
        ?14, ?15, ?16, ?17, 'gpt-test', 'writing-coach-v1'
      )`
    )
    .run(
      input.attemptId,
      userId,
      course.courseId,
      course.curriculumVersionId,
      lessonId,
      stepId,
      attemptNumber,
      input.idempotencyKey,
      status,
      answerText,
      failureCode,
      createdAt,
      quotaDate,
      inputTokenCount,
      latencyMs,
      outputTokenCount,
      resultJson
    )

  sqlite
    .query<void, [string, string, number]>(
      `INSERT INTO ai_feedback_user_daily_counters (
        user_id, quota_date, request_count, success_count, updated_at
      ) VALUES (?1, ?2, 1, ?3, 1)
      ON CONFLICT (user_id, quota_date) DO UPDATE SET
        request_count = request_count + 1,
        success_count = success_count + ?3`
    )
    .run(userId, quotaDate, status === "succeeded" ? 1 : 0)
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
