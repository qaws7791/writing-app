import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const contentStatusValues = ["active", "archived"] as const

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  status: text("status", { enum: contentStatusValues })
    .notNull()
    .default("active"),
  sortOrder: integer("sort_order").notNull(),
  curriculumRevision: integer("curriculum_revision").notNull().default(0),
})

export const courseUnits = sqliteTable("course_units", {
  id: text("id").primaryKey().notNull(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
  status: text("status", { enum: contentStatusValues })
    .notNull()
    .default("active"),
})

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey().notNull(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  unitId: text("unit_id")
    .notNull()
    .references(() => courseUnits.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category"),
  description: text("description"),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  summaryJson: text("summary_json").notNull(),
  sortOrder: integer("sort_order").notNull(),
  status: text("status", { enum: contentStatusValues })
    .notNull()
    .default("active"),
})

export const lessonSteps = sqliteTable("lesson_steps", {
  id: text("id").primaryKey().notNull(),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  sortOrder: integer("sort_order").notNull(),
  contentJson: text("content_json").notNull(),
  status: text("status", { enum: contentStatusValues })
    .notNull()
    .default("active"),
})
