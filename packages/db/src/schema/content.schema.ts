import {
  type AnySQLiteColumn,
  integer,
  sqliteTable,
  text,
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
  thumbnailPath: text("thumbnail_path").notNull(),
  sortOrder: integer("sort_order").notNull(),
})

export const courseChapters = sqliteTable("course_chapters", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  label: text("label").notNull(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
})

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
  contentJson: text("content_json").notNull(),
})
