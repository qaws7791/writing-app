import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core"

import {
  auditActionValues,
  auditCategoryValues,
  auditOutcomeValues,
  auditTargetTypeValues,
} from "#operations/domain/audit-event"

export const auditEvents = sqliteTable(
  "audit_events",
  {
    action: text("action", { enum: auditActionValues }).notNull(),
    actorId: text("actor_id").notNull(),
    category: text("category", { enum: auditCategoryValues }).notNull(),
    clientIp: text("client_ip"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey().notNull(),
    outcome: text("outcome", { enum: auditOutcomeValues }).notNull(),
    requestId: text("request_id").notNull(),
    retentionUntil: integer("retention_until", {
      mode: "timestamp_ms",
    }).notNull(),
    targetId: text("target_id").notNull(),
    targetType: text("target_type", {
      enum: auditTargetTypeValues,
    }).notNull(),
  },
  (table) => [
    check(
      "audit_events_category_check",
      sql`${table.category} IN ('privacy-access', 'identity-mutation', 'content-mutation')`
    ),
    check(
      "audit_events_action_check",
      sql`${table.action} IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete', 'course.publish', 'course.archive', 'course.restore')`
    ),
    check(
      "audit_events_outcome_check",
      sql`${table.outcome} IN ('started', 'succeeded', 'failed')`
    ),
    check(
      "audit_events_target_type_check",
      sql`${table.targetType} IN ('learner', 'course')`
    ),
    check(
      "audit_events_target_action_check",
      sql`(${table.targetType} = 'learner' AND ${table.action} IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR (${table.targetType} = 'course' AND ${table.action} IN ('course.publish', 'course.archive', 'course.restore'))`
    ),
    check(
      "audit_events_category_action_check",
      sql`(${table.category} = 'privacy-access' AND ${table.action} = 'learner.detail.read') OR (${table.category} = 'identity-mutation' AND ${table.action} IN ('learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR (${table.category} = 'content-mutation' AND ${table.action} IN ('course.publish', 'course.archive', 'course.restore'))`
    ),
    check(
      "audit_events_identifier_check",
      sql`length(${table.id}) BETWEEN 1 AND 200 AND ${table.id} NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(${table.actorId}) BETWEEN 1 AND 200 AND ${table.actorId} NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(${table.targetId}) BETWEEN 1 AND 200 AND ${table.targetId} NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(${table.requestId}) BETWEEN 1 AND 200 AND ${table.requestId} NOT GLOB '*[^A-Za-z0-9._:-]*'`
    ),
    check(
      "audit_events_retention_check",
      sql`(${table.category} IN ('privacy-access', 'content-mutation') AND ${table.retentionUntil} = ${table.createdAt} + 31536000000) OR (${table.category} = 'identity-mutation' AND ${table.retentionUntil} = ${table.createdAt} + 94608000000)`
    ),
    check(
      "audit_events_client_ip_check",
      sql`${table.clientIp} IS NULL OR (length(${table.clientIp}) BETWEEN 2 AND 45 AND ${table.clientIp} NOT GLOB '*[^0-9A-Fa-f:.]*')`
    ),
    index("audit_events_query_idx").on(table.createdAt, table.id),
    index("audit_events_retention_purge_idx").on(
      table.retentionUntil,
      table.id
    ),
  ]
)
