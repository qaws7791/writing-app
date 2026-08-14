import { sql } from "drizzle-orm"
import { authUsers } from "@workspace/auth/schema"
import {
  writingDifficultyValues,
  writingDomainValues,
} from "@workspace/contracts/writing/writing"
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const writingEventTypeValues = Object.freeze([
  "writing_created",
  "check_succeeded",
  "revised_after_check",
  "writing_deleted",
] as const)

export const writingTasks = sqliteTable(
  "writing_tasks",
  {
    audience: text("audience").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    difficulty: text("difficulty", {
      enum: writingDifficultyValues,
    })
      .notNull()
      .default("입문"),
    domain: text("domain", { enum: writingDomainValues })
      .notNull()
      .default("일상·실용문"),
    editVersion: integer("edit_version").notNull().default(0),
    goalChars: integer("goal_chars").notNull().default(0),
    id: text("id").primaryKey(),
    latestPublicationId: text("latest_publication_id"),
    minChars: integer("min_chars").notNull().default(0),
    requiredElementsJson: text("required_elements_json")
      .notNull()
      .default("[]"),
    situation: text("situation").notNull().default(""),
    title: text("title").notNull().default(""),
    typeName: text("type_name").notNull().default(""),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check(
      "writing_tasks_domain_check",
      sql`${table.domain} IN ('일상·실용문', '학업·논술문', '업무·비즈니스 문서', '창작·문학', '설득·의견문', '정보전달·설명문', '자기서사·기록', '관계·소통 문서', '공적·행정 문서', '디지털·뉴미디어')`
    ),
    check(
      "writing_tasks_difficulty_check",
      sql`${table.difficulty} IN ('입문', '기본', '심화')`
    ),
    check("writing_tasks_edit_version_check", sql`${table.editVersion} >= 0`),
    check(
      "writing_tasks_chars_check",
      sql`${table.minChars} >= 0 AND ${table.goalChars} >= 0`
    ),
    check(
      "writing_tasks_required_elements_check",
      sql`json_valid(${table.requiredElementsJson}) AND json_type(${table.requiredElementsJson}) = 'array'`
    ),
    index("writing_tasks_updated_idx").on(table.updatedAt, table.id),
  ]
)

export const writingTaskPublications = sqliteTable(
  "writing_task_publications",
  {
    audience: text("audience").notNull(),
    difficulty: text("difficulty", {
      enum: writingDifficultyValues,
    }).notNull(),
    domain: text("domain", { enum: writingDomainValues }).notNull(),
    goalChars: integer("goal_chars").notNull(),
    id: text("id").primaryKey(),
    minChars: integer("min_chars").notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }).notNull(),
    requiredElementsJson: text("required_elements_json").notNull(),
    situation: text("situation").notNull(),
    taskId: text("task_id")
      .notNull()
      .references(() => writingTasks.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    typeName: text("type_name").notNull(),
  },
  (table) => [
    check(
      "writing_task_publications_domain_check",
      sql`${table.domain} IN ('일상·실용문', '학업·논술문', '업무·비즈니스 문서', '창작·문학', '설득·의견문', '정보전달·설명문', '자기서사·기록', '관계·소통 문서', '공적·행정 문서', '디지털·뉴미디어')`
    ),
    check(
      "writing_task_publications_difficulty_check",
      sql`${table.difficulty} IN ('입문', '기본', '심화')`
    ),
    check(
      "writing_task_publications_chars_check",
      sql`${table.minChars} > 0 AND ${table.goalChars} >= ${table.minChars}`
    ),
    check(
      "writing_task_publications_text_check",
      sql`length(trim(${table.title})) > 0 AND length(trim(${table.typeName})) > 0 AND length(trim(${table.situation})) > 0 AND length(trim(${table.audience})) > 0`
    ),
    check(
      "writing_task_publications_required_elements_check",
      sql`json_valid(${table.requiredElementsJson}) AND json_type(${table.requiredElementsJson}) = 'array' AND json_array_length(${table.requiredElementsJson}) >= 1`
    ),
    index("writing_task_publications_task_idx").on(
      table.taskId,
      table.publishedAt,
      table.id
    ),
  ]
)

export const writings = sqliteTable(
  "writings",
  {
    body: text("body").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey(),
    publicationId: text("publication_id")
      .notNull()
      .references(() => writingTaskPublications.id, { onDelete: "restrict" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    version: integer("version").notNull().default(0),
  },
  (table) => [
    check("writings_version_check", sql`${table.version} >= 0`),
    index("writings_user_updated_idx").on(
      table.userId,
      table.updatedAt,
      table.id
    ),
    index("writings_publication_idx").on(table.publicationId),
  ]
)

export const writingChecks = sqliteTable(
  "writing_checks",
  {
    bodyVersion: integer("body_version").notNull(),
    id: text("id").primaryKey(),
    resultJson: text("result_json").notNull(),
    succeededAt: integer("succeeded_at", { mode: "timestamp_ms" }).notNull(),
    writingId: text("writing_id")
      .notNull()
      .references(() => writings.id, { onDelete: "cascade" }),
  },
  (table) => [
    check("writing_checks_body_version_check", sql`${table.bodyVersion} >= 0`),
    check(
      "writing_checks_result_check",
      sql`json_valid(${table.resultJson}) AND json_type(${table.resultJson}) = 'object'`
    ),
    uniqueIndex("writing_checks_writing_idx").on(table.writingId),
    index("writing_checks_succeeded_idx").on(table.succeededAt, table.id),
  ]
)

export const writingAiNotices = sqliteTable("writing_ai_notices", {
  acknowledgedAt: integer("acknowledged_at", {
    mode: "timestamp_ms",
  }).notNull(),
  userId: text("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "restrict" }),
})

export const writingEvents = sqliteTable(
  "writing_events",
  {
    eventType: text("event_type", { enum: writingEventTypeValues }).notNull(),
    recordedAt: integer("recorded_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    writingId: text("writing_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.writingId, table.eventType] }),
    check(
      "writing_events_type_check",
      sql`${table.eventType} IN ('writing_created', 'check_succeeded', 'revised_after_check', 'writing_deleted')`
    ),
    index("writing_events_type_recorded_idx").on(
      table.eventType,
      table.recordedAt
    ),
  ]
)

export * from "#writing/infrastructure/persistence/reporting-view"
