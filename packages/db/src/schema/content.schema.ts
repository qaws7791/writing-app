import {
  type AnySQLiteColumn,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const courseCategories = sqliteTable("course_categories", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
})

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => courseCategories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
})

export const curriculumVersions = sqliteTable(
  "curriculum_versions",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
    versionNumber: integer("version_number").notNull(),
    status: text("status", {
      enum: ["draft", "published", "archived"],
    }).notNull(),
    title: text("title").notNull(),
    changelog: text("changelog").notNull(),
    revision: integer("revision").notNull().default(1),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("curriculum_versions_course_version_idx").on(
      table.courseId,
      table.versionNumber
    ),
  ]
)

export const courseChapters = sqliteTable("course_chapters", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
})

export const curriculumVersionChapters = sqliteTable(
  "curriculum_version_chapters",
  {
    id: text("id").primaryKey(),
    curriculumVersionId: text("curriculum_version_id")
      .notNull()
      .references(() => curriculumVersions.id),
    sourceChapterId: text("source_chapter_id").references(
      () => courseChapters.id
    ),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull(),
    status: text("status", {
      enum: ["active", "deprecated", "archived"],
    }).notNull(),
  },
  (table) => [
    uniqueIndex("curriculum_version_chapters_version_sort_idx").on(
      table.curriculumVersionId,
      table.sortOrder
    ),
  ]
)

export const courseLessons = sqliteTable("course_lessons", {
  id: text("id").primaryKey(),
  chapterId: text("chapter_id")
    .notNull()
    .references(() => courseChapters.id),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
})

export const curriculumVersionLessons = sqliteTable(
  "curriculum_version_lessons",
  {
    id: text("id").primaryKey(),
    curriculumVersionId: text("curriculum_version_id")
      .notNull()
      .references(() => curriculumVersions.id),
    chapterId: text("chapter_id")
      .notNull()
      .references(() => curriculumVersionChapters.id),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    sortOrder: integer("sort_order").notNull(),
    status: text("status", {
      enum: ["active", "deprecated", "archived"],
    }).notNull(),
  },
  (table) => [
    uniqueIndex("curriculum_version_lessons_chapter_sort_idx").on(
      table.chapterId,
      table.sortOrder
    ),
  ]
)

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  title: text("title").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => courseCategories.id),
  unitNumber: integer("unit_number").notNull(),
  nextLessonId: text("next_lesson_id").references(
    (): AnySQLiteColumn => lessons.id
  ),
})

export const lessonSteps = sqliteTable("lesson_steps", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id),
  type: text("type", {
    enum: [
      "INTRO",
      "CONCEPT",
      "READING_PASSAGE",
      "EXAMPLE_REVEAL",
      "COMPARE",
      "MULTIPLE_CHOICE",
      "FILL_BLANK",
      "WORD_SELECT",
      "REORDER",
      "MATCH",
      "CLASSIFY",
      "SHORT_WRITE",
      "LONG_WRITE",
      "AI_FEEDBACK",
      "REVISION",
      "CHECKLIST",
      "REFLECTION",
      "SUMMARY",
      "TRANSCRIBE",
      "COMPLETE",
    ],
  }).notNull(),
  sortOrder: integer("sort_order").notNull(),
  points: integer("points").notNull(),
  required: integer("required", { mode: "boolean" }).notNull(),
  status: text("status", {
    enum: ["active", "deprecated", "archived"],
  })
    .notNull()
    .default("active"),
  contentJson: text("content_json").notNull(),
})

export const curriculumVersionSteps = sqliteTable(
  "curriculum_version_steps",
  {
    id: text("id").primaryKey(),
    curriculumVersionId: text("curriculum_version_id")
      .notNull()
      .references(() => curriculumVersions.id),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id),
    sourceStepId: text("source_step_id").references(() => lessonSteps.id),
    type: text("type", {
      enum: [
        "INTRO",
        "CONCEPT",
        "READING_PASSAGE",
        "EXAMPLE_REVEAL",
        "COMPARE",
        "MULTIPLE_CHOICE",
        "FILL_BLANK",
        "WORD_SELECT",
        "REORDER",
        "MATCH",
        "CLASSIFY",
        "SHORT_WRITE",
        "LONG_WRITE",
        "AI_FEEDBACK",
        "REVISION",
        "CHECKLIST",
        "REFLECTION",
        "SUMMARY",
        "TRANSCRIBE",
        "COMPLETE",
      ],
    }).notNull(),
    sortOrder: integer("sort_order").notNull(),
    points: integer("points").notNull(),
    required: integer("required", { mode: "boolean" }).notNull(),
    status: text("status", {
      enum: ["active", "deprecated", "archived"],
    }).notNull(),
    contentJson: text("content_json").notNull(),
  },
  (table) => [
    uniqueIndex("curriculum_version_steps_version_lesson_sort_idx").on(
      table.curriculumVersionId,
      table.lessonId,
      table.sortOrder
    ),
  ]
)
