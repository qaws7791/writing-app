import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import { authUsers } from "@workspace/db/schema/auth.schema"
import { lessons, lessonSteps } from "@workspace/db/schema/content.schema"

export const aiFeedbackAttempts = sqliteTable(
  "ai_feedback_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    stepId: text("step_id")
      .notNull()
      .references(() => lessonSteps.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status", {
      enum: ["pending", "succeeded", "failed", "expired"],
    }).notNull(),
    answerText: text("answer_text").notNull(),
    resultJson: text("result_json"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check(
      "ai_feedback_attempts_status_check",
      sql`${table.status} IN ('pending', 'succeeded', 'failed', 'expired')`
    ),
    uniqueIndex("ai_feedback_attempts_idempotency_idx").on(
      table.userId,
      table.lessonId,
      table.stepId,
      table.idempotencyKey
    ),
    uniqueIndex("ai_feedback_attempts_active_slot_idx")
      .on(table.userId, table.lessonId, table.stepId, table.attemptNumber)
      .where(sql`${table.status} IN ('pending', 'succeeded')`),
    uniqueIndex("ai_feedback_attempts_pending_idx")
      .on(table.userId, table.lessonId, table.stepId)
      .where(sql`${table.status} = 'pending'`),
    index("ai_feedback_attempts_expiry_idx").on(table.status, table.expiresAt),
  ]
)
