import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import { user } from "./auth.schema"
import { courses, lessons, lessonSteps } from "./content.schema"

export const courseProgress = sqliteTable(
  "course_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
    lastLessonId: text("last_lesson_id").references(() => lessons.id),
    completedCount: integer("completed_count").notNull().default(0),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("course_progress_user_course_idx").on(
      table.userId,
      table.courseId
    ),
  ]
)

export const lessonProgress = sqliteTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    currentStepId: text("current_step_id")
      .notNull()
      .references(() => lessonSteps.id, { onDelete: "cascade" }),
    stepOrder: integer("step_order").notNull(),
    status: text("status", {
      enum: ["not-started", "in-progress", "completed"],
    }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("lesson_progress_user_lesson_idx").on(
      table.userId,
      table.lessonId
    ),
  ]
)

export const lessonAnswers = sqliteTable(
  "lesson_answers",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    stepId: text("step_id")
      .notNull()
      .references(() => lessonSteps.id, { onDelete: "cascade" }),
    answer: text("answer").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("lesson_answers_user_lesson_step_idx").on(
      table.userId,
      table.lessonId,
      table.stepId
    ),
  ]
)

export const feedbackAttempts = sqliteTable(
  "feedback_attempts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    feedbackStepId: text("feedback_step_id")
      .notNull()
      .references(() => lessonSteps.id, { onDelete: "cascade" }),
    sourceStepId: text("source_step_id")
      .notNull()
      .references(() => lessonSteps.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    answerSnapshot: text("answer_snapshot").notNull(),
    resultJson: text("result_json").notNull(),
    status: text("status", { enum: ["completed"] }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("feedback_attempts_user_lesson_step_attempt_idx").on(
      table.userId,
      table.lessonId,
      table.feedbackStepId,
      table.attemptNumber
    ),
  ]
)
