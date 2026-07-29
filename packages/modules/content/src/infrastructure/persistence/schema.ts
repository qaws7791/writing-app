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
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core"

import {
  contentAssetAltTextMaxLength,
  contentAssetKindValues,
  contentAssetMaxBytes,
  contentAssetMimeTypeValues,
  contentAssetStatusValues,
} from "#content/domain/content-asset"
import {
  contentStatuses,
  contentStatusValues,
  courseVisualKeyValues,
} from "#content/domain/content-model"

export const curriculumVersionStatusValues = ["draft", "published"] as const

export const courses = sqliteTable(
  "courses",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey().notNull(),
    publishedCurriculumVersionId: text(
      "published_curriculum_version_id"
    ).references((): AnySQLiteColumn => courseCurriculumVersions.id, {
      onDelete: "restrict",
    }),
    sortOrder: integer("sort_order").notNull(),
    status: text("status", { enum: contentStatusValues })
      .notNull()
      .default(contentStatuses.active),
  },
  (table) => [
    check(
      "courses_status_check",
      sql`${table.status} IN ('active', 'archived')`
    ),
    check("courses_sort_order_check", sql`${table.sortOrder} > 0`),
  ]
)

export const courseCurriculumVersions = sqliteTable(
  "course_curriculum_versions",
  {
    category: text("category").notNull(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    coverAssetId: text("cover_asset_id").references(
      (): AnySQLiteColumn => contentAssets.id,
      { onDelete: "restrict" }
    ),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    description: text("description").notNull(),
    editVersion: integer("edit_version").notNull().default(0),
    id: text("id").primaryKey().notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    revision: integer("revision").notNull(),
    status: text("status", { enum: curriculumVersionStatusValues }).notNull(),
    title: text("title").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    visualKey: text("visual_key", {
      enum: courseVisualKeyValues,
    }).notNull(),
  },
  (table) => [
    check(
      "course_curriculum_versions_status_check",
      sql`${table.status} IN ('draft', 'published')`
    ),
    check(
      "course_curriculum_versions_revision_check",
      sql`${table.revision} > 0`
    ),
    check(
      "course_curriculum_versions_edit_version_check",
      sql`${table.editVersion} >= 0`
    ),
    check(
      "course_curriculum_versions_published_at_check",
      sql`(${table.status} = 'published' AND ${table.publishedAt} IS NOT NULL) OR (${table.status} = 'draft' AND ${table.publishedAt} IS NULL)`
    ),
    uniqueIndex("course_curriculum_versions_course_revision_idx").on(
      table.courseId,
      table.revision
    ),
    uniqueIndex("course_curriculum_versions_course_id_idx").on(
      table.courseId,
      table.id
    ),
    uniqueIndex("course_curriculum_versions_single_draft_idx")
      .on(table.courseId)
      .where(sql`${table.status} = 'draft'`),
    index("course_curriculum_versions_course_status_idx").on(
      table.courseId,
      table.status
    ),
  ]
)

export const contentAssets = sqliteTable(
  "content_assets",
  {
    altText: text("alt_text").notNull(),
    byteSize: integer("byte_size").notNull(),
    contentType: text("content_type", {
      enum: contentAssetMimeTypeValues,
    }).notNull(),
    courseId: text("course_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    curriculumVersionId: text("curriculum_version_id").notNull(),
    id: text("id").primaryKey().notNull(),
    kind: text("kind", { enum: contentAssetKindValues }).notNull(),
    objectKey: text("object_key").notNull(),
    orphanedAt: integer("orphaned_at", { mode: "timestamp_ms" }),
    status: text("status", { enum: contentAssetStatusValues })
      .notNull()
      .default("active"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.courseId, table.curriculumVersionId],
      foreignColumns: [
        courseCurriculumVersions.courseId,
        courseCurriculumVersions.id,
      ],
      name: "content_assets_curriculum_version_fk",
    }).onDelete("cascade"),
    check(
      "content_assets_kind_check",
      sql`${table.kind} IN ('course-cover', 'reading-illustration')`
    ),
    check(
      "content_assets_content_type_check",
      sql`${table.contentType} IN ('image/jpeg', 'image/png', 'image/webp')`
    ),
    check(
      "content_assets_byte_size_check",
      sql`${table.byteSize} > 0 AND ${table.byteSize} <= ${sql.raw(
        String(contentAssetMaxBytes)
      )}`
    ),
    check(
      "content_assets_alt_text_check",
      sql`length(trim(${table.altText})) > 0 AND length(${table.altText}) <= ${sql.raw(
        String(contentAssetAltTextMaxLength)
      )}`
    ),
    check(
      "content_assets_status_check",
      sql`${table.status} IN ('active', 'orphaned')`
    ),
    check(
      "content_assets_orphaned_at_check",
      sql`(${table.status} = 'active' AND ${table.orphanedAt} IS NULL) OR (${table.status} = 'orphaned' AND ${table.orphanedAt} IS NOT NULL)`
    ),
    check(
      "content_assets_updated_at_check",
      sql`${table.updatedAt} >= ${table.createdAt}`
    ),
    uniqueIndex("content_assets_object_key_idx").on(table.objectKey),
    index("content_assets_course_version_status_idx").on(
      table.courseId,
      table.curriculumVersionId,
      table.status
    ),
  ]
)

export const courseUnitVersions = sqliteTable(
  "course_unit_versions",
  {
    curriculumVersionId: text("curriculum_version_id")
      .notNull()
      .references(() => courseCurriculumVersions.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    sortOrder: integer("sort_order").notNull(),
    status: text("status", { enum: contentStatusValues })
      .notNull()
      .default(contentStatuses.active),
    title: text("title").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.curriculumVersionId, table.id] }),
    check(
      "course_unit_versions_status_check",
      sql`${table.status} IN ('active', 'archived')`
    ),
    check("course_unit_versions_sort_order_check", sql`${table.sortOrder} > 0`),
    uniqueIndex("course_unit_versions_sort_order_idx").on(
      table.curriculumVersionId,
      table.sortOrder
    ),
  ]
)

export const lessonVersions = sqliteTable(
  "lesson_versions",
  {
    category: text("category"),
    curriculumVersionId: text("curriculum_version_id")
      .notNull()
      .references(() => courseCurriculumVersions.id, { onDelete: "cascade" }),
    description: text("description"),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    id: text("id").notNull(),
    sortOrder: integer("sort_order").notNull(),
    status: text("status", { enum: contentStatusValues })
      .notNull()
      .default(contentStatuses.active),
    summaryJson: text("summary_json").notNull(),
    title: text("title").notNull(),
    unitId: text("unit_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.curriculumVersionId, table.id] }),
    foreignKey({
      columns: [table.curriculumVersionId, table.unitId],
      foreignColumns: [
        courseUnitVersions.curriculumVersionId,
        courseUnitVersions.id,
      ],
      name: "lesson_versions_unit_fk",
    }).onDelete("cascade"),
    check(
      "lesson_versions_status_check",
      sql`${table.status} IN ('active', 'archived')`
    ),
    check("lesson_versions_sort_order_check", sql`${table.sortOrder} > 0`),
    check(
      "lesson_versions_estimated_minutes_check",
      sql`${table.estimatedMinutes} > 0`
    ),
    uniqueIndex("lesson_versions_unit_sort_order_idx").on(
      table.curriculumVersionId,
      table.unitId,
      table.sortOrder
    ),
    uniqueIndex("lesson_versions_version_id_idx").on(
      table.curriculumVersionId,
      table.id
    ),
  ]
)

export const lessonStepVersions = sqliteTable(
  "lesson_step_versions",
  {
    contentJson: text("content_json").notNull(),
    curriculumVersionId: text("curriculum_version_id")
      .notNull()
      .references(() => courseCurriculumVersions.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    lessonId: text("lesson_id").notNull(),
    sortOrder: integer("sort_order").notNull(),
    status: text("status", { enum: contentStatusValues })
      .notNull()
      .default(contentStatuses.active),
    type: text("type").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.curriculumVersionId, table.id] }),
    foreignKey({
      columns: [table.curriculumVersionId, table.lessonId],
      foreignColumns: [lessonVersions.curriculumVersionId, lessonVersions.id],
      name: "lesson_step_versions_lesson_fk",
    }).onDelete("cascade"),
    check(
      "lesson_step_versions_status_check",
      sql`${table.status} IN ('active', 'archived')`
    ),
    check("lesson_step_versions_sort_order_check", sql`${table.sortOrder} > 0`),
    uniqueIndex("lesson_step_versions_lesson_sort_order_idx").on(
      table.curriculumVersionId,
      table.lessonId,
      table.sortOrder
    ),
    uniqueIndex("lesson_step_versions_lesson_id_idx").on(
      table.curriculumVersionId,
      table.lessonId,
      table.id
    ),
  ]
)

export * from "#content/infrastructure/persistence/reporting-view"
