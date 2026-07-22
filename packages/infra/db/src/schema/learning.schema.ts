import { sql } from "drizzle-orm"
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

import {
  persistedLessonProgressStatuses,
  persistedLessonProgressStatusValues,
} from "#db/persisted-values"
import { authUsers } from "@workspace/auth/schema"

const learningProgressStatuses = persistedLessonProgressStatuses
export const lessonProgressStatusValues = persistedLessonProgressStatusValues
export const courseProgressStatusValues = persistedLessonProgressStatusValues

export const learnerActivityDays = sqliteTable(
  "learner_activity_days",
  {
    activityDate: text("activity_date").notNull(),
    completedLessons: integer("completed_lessons").notNull().default(0),
    firstActivityAt: integer("first_activity_at", {
      mode: "timestamp_ms",
    }).notNull(),
    lastActivityAt: integer("last_activity_at", {
      mode: "timestamp_ms",
    }).notNull(),
    savedAnswers: integer("saved_answers").notNull().default(0),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.activityDate] }),
    check(
      "learner_activity_days_completed_lessons_check",
      sql`${table.completedLessons} >= 0`
    ),
    check(
      "learner_activity_days_saved_answers_check",
      sql`${table.savedAnswers} >= 0`
    ),
  ]
)

export const learnerCourseProgress = sqliteTable(
  "learner_course_progress",
  {
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    courseId: text("course_id").notNull(),
    curriculumVersionId: text("curriculum_version_id").notNull(),
    lastActivityAt: integer("last_activity_at", {
      mode: "timestamp_ms",
    }).notNull(),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    status: text("status", { enum: courseProgressStatusValues })
      .notNull()
      .default(learningProgressStatuses.inProgress),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.courseId] }),
    check(
      "learner_course_progress_status_check",
      sql`${table.status} IN ('in_progress', 'completed')`
    ),
    uniqueIndex("learner_course_progress_version_scope_idx").on(
      table.userId,
      table.courseId,
      table.curriculumVersionId
    ),
    index("learner_course_progress_activity_idx").on(
      table.userId,
      table.lastActivityAt,
      table.courseId
    ),
  ]
)

export const learnerLessonProgress = sqliteTable(
  "learner_lesson_progress",
  {
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    courseId: text("course_id").notNull(),
    curriculumVersionId: text("curriculum_version_id").notNull(),
    currentStepId: text("current_step_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    status: text("status", { enum: lessonProgressStatusValues })
      .notNull()
      .default(learningProgressStatuses.inProgress),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.curriculumVersionId, table.lessonId],
    }),
    foreignKey({
      columns: [table.userId, table.courseId, table.curriculumVersionId],
      foreignColumns: [
        learnerCourseProgress.userId,
        learnerCourseProgress.courseId,
        learnerCourseProgress.curriculumVersionId,
      ],
      name: "learner_lesson_progress_course_progress_fk",
    }).onDelete("cascade"),
    check(
      "learner_lesson_progress_status_check",
      sql`${table.status} IN ('in_progress', 'completed')`
    ),
    index("learner_lesson_progress_user_course_idx").on(
      table.userId,
      table.courseId
    ),
  ]
)

export const learnerLessonAnswers = sqliteTable(
  "learner_lesson_answers",
  {
    answerJson: text("answer_json").notNull(),
    answeredAt: integer("answered_at", { mode: "timestamp_ms" }).notNull(),
    courseId: text("course_id").notNull(),
    curriculumVersionId: text("curriculum_version_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    stepId: text("step_id").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.curriculumVersionId, table.stepId],
    }),
    foreignKey({
      columns: [table.userId, table.courseId, table.curriculumVersionId],
      foreignColumns: [
        learnerCourseProgress.userId,
        learnerCourseProgress.courseId,
        learnerCourseProgress.curriculumVersionId,
      ],
      name: "learner_lesson_answers_course_progress_fk",
    }).onDelete("cascade"),
    index("learner_lesson_answers_lesson_idx").on(
      table.userId,
      table.curriculumVersionId,
      table.lessonId
    ),
  ]
)
