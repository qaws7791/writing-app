import { sql } from "drizzle-orm"
import { authUsers } from "@workspace/auth/schema"
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core"

export const writingModeValues = Object.freeze([
  "free",
  "explain",
  "argue",
] as const)
export const writingStatusValues = Object.freeze([
  "drafting",
  "checked",
] as const)
export const writingEventTypeValues = Object.freeze([
  "writing_created",
  "self_check_started",
  "revised_after_self_check",
  "self_check_completed",
  "writing_deleted",
] as const)

export const writings = sqliteTable(
  "writings",
  {
    body: text("body").notNull(),
    checkedAt: integer("checked_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey(),
    mode: text("mode", { enum: writingModeValues }).notNull(),
    selfCheckStartedAt: integer("self_check_started_at", {
      mode: "timestamp_ms",
    }),
    status: text("status", { enum: writingStatusValues })
      .notNull()
      .default("drafting"),
    title: text("title").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "restrict" }),
    version: integer("version").notNull().default(0),
  },
  (table) => [
    check(
      "writings_mode_check",
      sql`${table.mode} IN ('free', 'explain', 'argue')`
    ),
    check(
      "writings_status_check",
      sql`${table.status} IN ('drafting', 'checked')`
    ),
    check("writings_version_check", sql`${table.version} >= 0`),
    check(
      "writings_checked_at_check",
      sql`(${table.status} = 'drafting' AND ${table.checkedAt} IS NULL) OR (${table.status} = 'checked' AND ${table.checkedAt} IS NOT NULL)`
    ),
    index("writings_user_updated_idx").on(
      table.userId,
      table.updatedAt,
      table.id
    ),
  ]
)

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
      sql`${table.eventType} IN ('writing_created', 'self_check_started', 'revised_after_self_check', 'self_check_completed', 'writing_deleted')`
    ),
    index("writing_events_type_recorded_idx").on(
      table.eventType,
      table.recordedAt
    ),
  ]
)

export * from "#writing/infrastructure/persistence/reporting-view"
