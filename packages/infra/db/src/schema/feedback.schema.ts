import { sql } from "drizzle-orm"
import {
  check,
  foreignKey,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import { authUsers } from "@workspace/auth/schema"
import { lessonStepVersions } from "#db/schema/content.schema"
import { learnerCourseProgress } from "#db/schema/learning.schema"

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
    lessonId: text("lesson_id").notNull(),
    resultJson: text("result_json"),
    status: text("status", {
      enum: ["pending", "succeeded", "failed", "expired"],
    }).notNull(),
    stepId: text("step_id").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
  },
  (table) => [
    foreignKey({
      columns: [table.userId, table.courseId, table.curriculumVersionId],
      foreignColumns: [
        learnerCourseProgress.userId,
        learnerCourseProgress.courseId,
        learnerCourseProgress.curriculumVersionId,
      ],
      name: "ai_feedback_attempts_course_progress_fk",
    }).onDelete("cascade"),
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
  ]
)
