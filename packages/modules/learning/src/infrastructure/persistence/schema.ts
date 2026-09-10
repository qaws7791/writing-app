import { asc, desc, sql } from "drizzle-orm"
import { authUsers } from "@workspace/auth/schema"
import {
  courseCurriculumVersions,
  lessonStepVersions,
  lessonVersions,
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

const learningProgressStatuses = {
  completed: "completed",
  inProgress: "in_progress",
} as const
/** Exported singleton shared by schema consumers; runtime mutation would redefine persisted status values. */
export const lessonProgressStatusValues = Object.freeze([
  learningProgressStatuses.inProgress,
  learningProgressStatuses.completed,
] as const)
export const learnerStepDraftAnswerJsonMaxBytes = 65_536

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
      .references(() => authUsers.id, { onDelete: "restrict" }),
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

export const learnerReportingSummaries = sqliteTable(
  "learner_reporting_summaries",
  {
    completedLessons: integer("completed_lessons").notNull().default(0),
    lastActive: text("last_active"),
    streakDaysAtLastActivity: integer("streak_days_at_last_activity")
      .notNull()
      .default(0),
    userId: text("user_id")
      .primaryKey()
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
  },
  (table) => [
    check(
      "learner_reporting_summaries_completed_lessons_check",
      sql`${table.completedLessons} >= 0`
    ),
    check(
      "learner_reporting_summaries_streak_days_check",
      sql`${table.streakDaysAtLastActivity} >= 0`
    ),
    index("learner_reporting_summaries_last_active_idx").on(
      desc(table.lastActive),
      asc(table.userId)
    ),
    index("learner_reporting_summaries_completed_lessons_idx").on(
      desc(table.completedLessons),
      asc(table.userId)
    ),
    index("learner_reporting_summaries_streak_idx").on(
      desc(table.streakDaysAtLastActivity),
      asc(table.userId)
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
    status: text("status", { enum: lessonProgressStatusValues })
      .notNull()
      .default(learningProgressStatuses.inProgress),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.courseId] }),
    foreignKey({
      columns: [table.courseId, table.curriculumVersionId],
      foreignColumns: [
        courseCurriculumVersions.courseId,
        courseCurriculumVersions.id,
      ],
      name: "learner_course_progress_curriculum_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [authUsers.id],
      name: "learner_course_progress_user_fk",
    }).onDelete("restrict"),
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
      desc(table.lastActivityAt),
      asc(table.courseId)
    ),
    index("learner_course_progress_status_activity_idx").on(
      table.userId,
      table.status,
      desc(table.lastActivityAt),
      asc(table.courseId)
    ),
  ]
)

export const learnerLessonProgress = sqliteTable(
  "learner_lesson_progress",
  {
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    completedStepIdsJson: text("completed_step_ids_json")
      .notNull()
      .default("[]"),
    courseId: text("course_id").notNull(),
    curriculumVersionId: text("curriculum_version_id").notNull(),
    currentStepId: text("current_step_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    status: text("status", { enum: lessonProgressStatusValues })
      .notNull()
      .default(learningProgressStatuses.inProgress),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id").notNull(),
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
    foreignKey({
      columns: [table.curriculumVersionId, table.lessonId],
      foreignColumns: [lessonVersions.curriculumVersionId, lessonVersions.id],
      name: "learner_lesson_progress_lesson_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.curriculumVersionId, table.lessonId, table.currentStepId],
      foreignColumns: [
        lessonStepVersions.curriculumVersionId,
        lessonStepVersions.lessonId,
        lessonStepVersions.id,
      ],
      name: "learner_lesson_progress_current_step_fk",
    }).onDelete("restrict"),
    check(
      "learner_lesson_progress_status_check",
      sql`${table.status} IN ('in_progress', 'completed')`
    ),
    check(
      "learner_lesson_progress_completed_step_ids_json_check",
      sql`json_valid(${table.completedStepIdsJson}) AND json_type(${table.completedStepIdsJson}) = 'array'`
    ),
    index("learner_lesson_progress_user_course_idx").on(
      table.userId,
      table.courseId
    ),
    index("learner_lesson_progress_user_lesson_idx").on(
      table.userId,
      table.lessonId
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
    userId: text("user_id").notNull(),
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
    foreignKey({
      columns: [table.curriculumVersionId, table.lessonId, table.stepId],
      foreignColumns: [
        lessonStepVersions.curriculumVersionId,
        lessonStepVersions.lessonId,
        lessonStepVersions.id,
      ],
      name: "learner_lesson_answers_step_fk",
    }).onDelete("restrict"),
    index("learner_lesson_answers_lesson_idx").on(
      table.userId,
      table.curriculumVersionId,
      table.lessonId
    ),
  ]
)

export const learnerStepDrafts = sqliteTable(
  "learner_step_drafts",
  {
    answerJson: text("answer_json").notNull(),
    courseId: text("course_id").notNull(),
    curriculumVersionId: text("curriculum_version_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    stepId: text("step_id").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id").notNull(),
    version: integer("version").notNull().default(0),
  },
  (table) => [
    primaryKey({
      columns: [
        table.userId,
        table.courseId,
        table.curriculumVersionId,
        table.lessonId,
        table.stepId,
      ],
    }),
    foreignKey({
      columns: [table.userId, table.courseId, table.curriculumVersionId],
      foreignColumns: [
        learnerCourseProgress.userId,
        learnerCourseProgress.courseId,
        learnerCourseProgress.curriculumVersionId,
      ],
      name: "learner_step_drafts_course_progress_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.curriculumVersionId, table.lessonId, table.stepId],
      foreignColumns: [
        lessonStepVersions.curriculumVersionId,
        lessonStepVersions.lessonId,
        lessonStepVersions.id,
      ],
      name: "learner_step_drafts_step_fk",
    }).onDelete("cascade"),
    check(
      "learner_step_drafts_answer_json_size_check",
      sql`length(CAST(${table.answerJson} AS BLOB)) <= ${sql.raw(
        String(learnerStepDraftAnswerJsonMaxBytes)
      )}`
    ),
    check("learner_step_drafts_version_check", sql`${table.version} >= 0`),
    index("learner_step_drafts_lesson_idx").on(
      table.userId,
      table.curriculumVersionId,
      table.lessonId
    ),
  ]
)

export * from "#learning/infrastructure/persistence/reporting-view"
