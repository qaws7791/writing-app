import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

import {
  learnerAccountStatuses,
  learnerAccountStatusValues,
  lessonProgressStatuses,
  lessonProgressStatusValues,
} from "@workspace/core/status"
import { authUsers } from "@workspace/db/schema/auth.schema"
import { lessons, lessonSteps } from "@workspace/db/schema/content.schema"

export { learnerAccountStatusValues as learnerProfileStatusValues }
export { lessonProgressStatusValues } from "@workspace/core/status"

export const learnerProfiles = sqliteTable("learner_profiles", {
  userId: text("user_id")
    .primaryKey()
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  status: text("status", { enum: learnerAccountStatusValues })
    .notNull()
    .default(learnerAccountStatuses.active),
  displayName: text("display_name"),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
})

export const learnerActivityDays = sqliteTable(
  "learner_activity_days",
  {
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    activityDate: text("activity_date").notNull(),
    firstActivityAt: integer("first_activity_at", {
      mode: "timestamp_ms",
    }).notNull(),
    lastActivityAt: integer("last_activity_at", {
      mode: "timestamp_ms",
    }).notNull(),
    completedLessons: integer("completed_lessons").notNull().default(0),
    savedAnswers: integer("saved_answers").notNull().default(0),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.activityDate],
    }),
  ]
)

export const learnerLessonProgress = sqliteTable(
  "learner_lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    currentStepIndex: integer("current_step_index").notNull().default(0),
    status: text("status", { enum: lessonProgressStatusValues })
      .notNull()
      .default(lessonProgressStatuses.inProgress),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.lessonId],
    }),
  ]
)

export const learnerLessonAnswers = sqliteTable(
  "learner_lesson_answers",
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
    answerJson: text("answer_json").notNull(),
    answeredAt: integer("answered_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.stepId],
    }),
  ]
)
