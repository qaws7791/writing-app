import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import { user } from "@/schema/auth.schema"
import { courses, curriculumVersions, lessons } from "@/schema/content.schema"

export const curriculumVersionMigrations = sqliteTable(
  "curriculum_version_migrations",
  {
    id: text("id").primaryKey(),
    fromVersionId: text("from_version_id")
      .notNull()
      .references(() => curriculumVersions.id),
    toVersionId: text("to_version_id")
      .notNull()
      .references(() => curriculumVersions.id),
    status: text("status", {
      enum: ["active", "archived"],
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("curriculum_version_migrations_version_pair_idx").on(
      table.fromVersionId,
      table.toVersionId
    ),
  ]
)

export const lessonMigrationMappings = sqliteTable(
  "lesson_migration_mappings",
  {
    id: text("id").primaryKey(),
    migrationId: text("migration_id")
      .notNull()
      .references(() => curriculumVersionMigrations.id),
    fromLessonId: text("from_lesson_id")
      .notNull()
      .references(() => lessons.id),
    toLessonId: text("to_lesson_id").references(() => lessons.id),
    mappingType: text("mapping_type", {
      enum: ["equivalent", "split", "merged", "removed"],
    }).notNull(),
  },
  (table) => [
    uniqueIndex("lesson_migration_mappings_migration_pair_idx").on(
      table.migrationId,
      table.fromLessonId,
      table.toLessonId,
      table.mappingType
    ),
  ]
)

export const curriculumMigrationApplications = sqliteTable(
  "curriculum_migration_applications",
  {
    id: text("id").primaryKey(),
    migrationId: text("migration_id")
      .notNull()
      .references(() => curriculumVersionMigrations.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
    fromVersionId: text("from_version_id")
      .notNull()
      .references(() => curriculumVersions.id),
    toVersionId: text("to_version_id")
      .notNull()
      .references(() => curriculumVersions.id),
    status: text("status", {
      enum: ["completed", "failed"],
    }).notNull(),
    completedLessonCount: integer("completed_lesson_count").notNull(),
    resultJson: text("result_json").notNull(),
    errorMessage: text("error_message"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("curriculum_migration_applications_migration_user_idx").on(
      table.migrationId,
      table.userId
    ),
  ]
)

export const curriculumUpgradeDismissals = sqliteTable(
  "curriculum_upgrade_dismissals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
    fromVersionId: text("from_version_id")
      .notNull()
      .references(() => curriculumVersions.id),
    toVersionId: text("to_version_id")
      .notNull()
      .references(() => curriculumVersions.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("curriculum_upgrade_dismissals_pair_idx").on(
      table.userId,
      table.courseId,
      table.fromVersionId,
      table.toVersionId
    ),
  ]
)
