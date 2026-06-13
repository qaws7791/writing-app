import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { authUsers } from "@workspace/db/schema/auth.schema"
import { lessons, lessonSteps } from "@workspace/db/schema/content.schema"

export const aiFeedbackAttempts = sqliteTable(
  "ai_feedback_attempts",
  {
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
    answerText: text("answer_text").notNull(),
    resultJson: text("result_json").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.stepId, table.attemptNumber],
    }),
  ]
)
