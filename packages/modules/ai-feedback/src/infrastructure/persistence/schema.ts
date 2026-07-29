import { sql } from "drizzle-orm"
import { authUsers } from "@workspace/auth/schema"
import {
  courseCurriculumVersions,
  lessonStepVersions,
} from "@workspace/content/migration-schema"
import {
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import { aiFeedbackFailureCodeValues } from "#ai-feedback/domain/ai-feedback-attempt"

export const aiFeedbackAttempts = sqliteTable(
  "ai_feedback_attempts",
  {
    answerText: text("answer_text").notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    courseId: text("course_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    curriculumVersionId: text("curriculum_version_id").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    inputTokenCount: integer("input_token_count"),
    latencyMs: integer("latency_ms"),
    lessonId: text("lesson_id").notNull(),
    model: text("model").notNull(),
    outputTokenCount: integer("output_token_count"),
    promptPolicyVersion: text("prompt_policy_version").notNull(),
    quotaDate: text("quota_date").notNull(),
    resultJson: text("result_json"),
    failureCode: text("failure_code", {
      enum: aiFeedbackFailureCodeValues,
    }),
    status: text("status", {
      enum: ["pending", "succeeded", "failed", "expired"],
    }).notNull(),
    stepId: text("step_id").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: "ai_feedback_attempts_user_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.courseId, table.curriculumVersionId],
      foreignColumns: [
        courseCurriculumVersions.courseId,
        courseCurriculumVersions.id,
      ],
      name: "ai_feedback_attempts_curriculum_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.curriculumVersionId, table.lessonId, table.stepId],
      foreignColumns: [
        lessonStepVersions.curriculumVersionId,
        lessonStepVersions.lessonId,
        lessonStepVersions.id,
      ],
      name: "ai_feedback_attempts_step_fk",
    }).onDelete("restrict"),
    check(
      "ai_feedback_attempts_status_check",
      sql`${table.status} IN ('pending', 'succeeded', 'failed', 'expired')`
    ),
    check(
      "ai_feedback_attempts_attempt_number_check",
      sql`${table.attemptNumber} > 0`
    ),
    check(
      "ai_feedback_attempts_usage_count_check",
      sql`(${table.inputTokenCount} IS NULL AND ${table.outputTokenCount} IS NULL) OR (${table.inputTokenCount} >= 0 AND ${table.outputTokenCount} >= 0)`
    ),
    check(
      "ai_feedback_attempts_latency_check",
      sql`${table.latencyMs} IS NULL OR ${table.latencyMs} >= 0`
    ),
    check(
      "ai_feedback_attempts_failure_code_check",
      sql`(${table.status} IN ('pending', 'succeeded') AND ${table.failureCode} IS NULL) OR (${table.status} = 'failed' AND ${table.failureCode} IN ('persistence-failed', 'provider-response-invalid', 'provider-timeout', 'provider-unavailable', 'request-aborted')) OR (${table.status} = 'expired' AND ${table.failureCode} = 'pending-expired')`
    ),
    uniqueIndex("ai_feedback_attempts_idempotency_idx").on(
      table.userId,
      table.curriculumVersionId,
      table.lessonId,
      table.stepId,
      table.idempotencyKey
    ),
    uniqueIndex("ai_feedback_attempts_active_slot_idx")
      .on(
        table.userId,
        table.curriculumVersionId,
        table.lessonId,
        table.stepId,
        table.attemptNumber
      )
      .where(sql`${table.status} IN ('pending', 'succeeded')`),
    uniqueIndex("ai_feedback_attempts_pending_idx")
      .on(table.userId, table.curriculumVersionId, table.lessonId, table.stepId)
      .where(sql`${table.status} = 'pending'`),
    index("ai_feedback_attempts_expiry_idx").on(table.status, table.expiresAt),
    index("ai_feedback_attempts_daily_status_idx").on(
      table.quotaDate,
      table.status,
      table.userId
    ),
  ]
)

export const aiFeedbackUserDailyCounters = sqliteTable(
  "ai_feedback_user_daily_counters",
  {
    quotaDate: text("quota_date").notNull(),
    requestCount: integer("request_count").notNull(),
    successCount: integer("success_count").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: "ai_feedback_user_daily_counters_user_fk",
    }).onDelete("restrict"),
    primaryKey({
      columns: [table.userId, table.quotaDate],
      name: "ai_feedback_user_daily_counters_pk",
    }),
    check(
      "ai_feedback_user_daily_counters_count_check",
      sql`${table.requestCount} >= 0 AND ${table.successCount} >= 0 AND ${table.successCount} <= ${table.requestCount}`
    ),
    index("ai_feedback_user_daily_counters_date_idx").on(table.quotaDate),
  ]
)

export const aiFeedbackGlobalDailyCounters = sqliteTable(
  "ai_feedback_global_daily_counters",
  {
    quotaDate: text("quota_date").primaryKey(),
    requestCount: integer("request_count").notNull(),
    successCount: integer("success_count").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check(
      "ai_feedback_global_daily_counters_count_check",
      sql`${table.requestCount} >= 0 AND ${table.successCount} >= 0 AND ${table.successCount} <= ${table.requestCount}`
    ),
  ]
)

export * from "#ai-feedback/infrastructure/persistence/reporting-view"
