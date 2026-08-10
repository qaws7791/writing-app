import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import {
  auditActionValues,
  auditCategoryValues,
  auditOutcomeValues,
  auditTargetTypeValues,
} from "#operations/domain/audit-event"
import {
  adminMcpApprovalStatusValues,
  adminMcpApprovalTargetKindValues,
  adminMcpChangeToolNameValues,
} from "#operations/domain/admin-mcp-approval"

export const adminMcpChangeApprovals = sqliteTable(
  "admin_mcp_change_approvals",
  {
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    decidedAt: integer("decided_at", { mode: "timestamp_ms" }),
    executionStartedAt: integer("execution_started_at", {
      mode: "timestamp_ms",
    }),
    expectedCourseStatus: text("expected_course_status", {
      enum: ["active", "archived"],
    }),
    expectedUserStatus: text("expected_user_status", {
      enum: ["active", "suspended"],
    }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    failureCode: text("failure_code"),
    id: text("id").primaryKey().notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    inputDigest: text("input_digest").notNull(),
    oauthClientId: text("oauth_client_id").notNull(),
    ownerAdminId: text("owner_admin_id").notNull(),
    requestId: text("request_id").notNull(),
    status: text("status", { enum: adminMcpApprovalStatusValues }).notNull(),
    targetCourseId: text("target_course_id"),
    targetEditVersion: integer("target_edit_version"),
    targetKind: text("target_kind", {
      enum: adminMcpApprovalTargetKindValues,
    }).notNull(),
    targetTitle: text("target_title"),
    targetUserId: text("target_user_id"),
    targetUserStatus: text("target_user_status", {
      enum: ["active", "suspended"],
    }),
    toolName: text("tool_name", {
      enum: adminMcpChangeToolNameValues,
    }).notNull(),
  },
  (table) => [
    check(
      "admin_mcp_change_approvals_status_check",
      sql`${table.status} IN ('pending', 'approved', 'rejected', 'expired', 'executing', 'succeeded', 'failed')`
    ),
    check(
      "admin_mcp_change_approvals_tool_check",
      sql`${table.toolName} IN ('admin_create_course_draft', 'admin_archive_course', 'admin_restore_course', 'admin_publish_course', 'admin_set_user_status', 'admin_delete_user')`
    ),
    check(
      "admin_mcp_change_approvals_target_check",
      sql`((${table.targetKind} = 'course-create' AND ${table.targetCourseId} IS NOT NULL AND ${table.targetEditVersion} >= 0 AND ${table.targetTitle} IS NOT NULL AND ${table.expectedCourseStatus} IS NULL AND ${table.targetUserId} IS NULL AND ${table.expectedUserStatus} IS NULL AND ${table.targetUserStatus} IS NULL AND ${table.toolName} = 'admin_create_course_draft') OR (${table.targetKind} = 'course-lifecycle' AND ${table.targetCourseId} IS NOT NULL AND ${table.targetEditVersion} >= 0 AND ${table.targetTitle} IS NOT NULL AND ${table.targetUserId} IS NULL AND ${table.expectedUserStatus} IS NULL AND ${table.targetUserStatus} IS NULL AND ((${table.expectedCourseStatus} = 'active' AND ${table.toolName} = 'admin_archive_course') OR (${table.expectedCourseStatus} = 'archived' AND ${table.toolName} = 'admin_restore_course'))) OR (${table.targetKind} = 'course-publish' AND ${table.targetCourseId} IS NOT NULL AND ${table.targetEditVersion} >= 0 AND ${table.targetTitle} IS NOT NULL AND ${table.expectedCourseStatus} IS NULL AND ${table.targetUserId} IS NULL AND ${table.expectedUserStatus} IS NULL AND ${table.targetUserStatus} IS NULL AND ${table.toolName} = 'admin_publish_course') OR (${table.targetKind} = 'user-status' AND ${table.targetCourseId} IS NULL AND ${table.targetEditVersion} IS NULL AND ${table.targetTitle} IS NULL AND ${table.expectedCourseStatus} IS NULL AND ${table.targetUserId} IS NOT NULL AND ${table.expectedUserStatus} IN ('active', 'suspended') AND ${table.targetUserStatus} IN ('active', 'suspended') AND ${table.expectedUserStatus} <> ${table.targetUserStatus} AND ${table.toolName} = 'admin_set_user_status') OR (${table.targetKind} = 'user-delete' AND ${table.targetCourseId} IS NULL AND ${table.targetEditVersion} IS NULL AND ${table.targetTitle} IS NULL AND ${table.expectedCourseStatus} IS NULL AND ${table.targetUserId} IS NOT NULL AND ${table.expectedUserStatus} IN ('active', 'suspended') AND ${table.targetUserStatus} IS NULL AND ${table.toolName} = 'admin_delete_user'))`
    ),
    check(
      "admin_mcp_change_approvals_identifier_check",
      sql`length(${table.id}) BETWEEN 1 AND 200 AND ${table.id} NOT GLOB '*[^A-Za-z0-9._:-]*' AND length(${table.ownerAdminId}) BETWEEN 1 AND 200 AND ${table.ownerAdminId} NOT GLOB '*[^A-Za-z0-9._:-]*' AND (${table.targetCourseId} IS NULL OR (length(${table.targetCourseId}) BETWEEN 1 AND 200 AND ${table.targetCourseId} NOT GLOB '*[^A-Za-z0-9._:-]*')) AND (${table.targetUserId} IS NULL OR (length(${table.targetUserId}) BETWEEN 1 AND 200 AND ${table.targetUserId} NOT GLOB '*[^A-Za-z0-9._:-]*')) AND length(${table.requestId}) BETWEEN 1 AND 200 AND ${table.requestId} NOT GLOB '*[^A-Za-z0-9._:-]*'`
    ),
    check(
      "admin_mcp_change_approvals_idempotency_check",
      sql`length(${table.idempotencyKey}) BETWEEN 16 AND 128 AND ${table.idempotencyKey} NOT GLOB '*[^A-Za-z0-9._:-]*'`
    ),
    check(
      "admin_mcp_change_approvals_digest_check",
      sql`length(${table.inputDigest}) = 64 AND ${table.inputDigest} NOT GLOB '*[^a-f0-9]*'`
    ),
    check(
      "admin_mcp_change_approvals_text_check",
      sql`length(${table.oauthClientId}) BETWEEN 1 AND 200 AND (${table.targetTitle} IS NULL OR length(trim(${table.targetTitle})) BETWEEN 1 AND 200)`
    ),
    check(
      "admin_mcp_change_approvals_time_check",
      sql`${table.expiresAt} > ${table.createdAt} AND (${table.decidedAt} IS NULL OR ${table.decidedAt} >= ${table.createdAt}) AND (${table.executionStartedAt} IS NULL OR ${table.executionStartedAt} >= ${table.createdAt}) AND (${table.completedAt} IS NULL OR ${table.completedAt} >= ${table.createdAt})`
    ),
    check(
      "admin_mcp_change_approvals_state_time_check",
      sql`(${table.status} = 'pending' AND ${table.decidedAt} IS NULL AND ${table.executionStartedAt} IS NULL AND ${table.completedAt} IS NULL AND ${table.failureCode} IS NULL) OR (${table.status} IN ('approved', 'rejected') AND ${table.decidedAt} IS NOT NULL AND ${table.executionStartedAt} IS NULL AND ${table.completedAt} IS NULL AND ${table.failureCode} IS NULL) OR (${table.status} = 'expired' AND ${table.executionStartedAt} IS NULL AND ${table.completedAt} IS NOT NULL AND ${table.failureCode} IS NULL) OR (${table.status} = 'executing' AND ${table.decidedAt} IS NOT NULL AND ${table.executionStartedAt} IS NOT NULL AND ${table.completedAt} IS NULL AND ${table.failureCode} IS NULL) OR (${table.status} = 'succeeded' AND ${table.decidedAt} IS NOT NULL AND ${table.executionStartedAt} IS NOT NULL AND ${table.completedAt} IS NOT NULL AND ${table.failureCode} IS NULL) OR (${table.status} = 'failed' AND ${table.decidedAt} IS NOT NULL AND ${table.executionStartedAt} IS NOT NULL AND ${table.completedAt} IS NOT NULL AND length(${table.failureCode}) BETWEEN 1 AND 100)`
    ),
    uniqueIndex("admin_mcp_change_approvals_idempotency_idx").on(
      table.ownerAdminId,
      table.oauthClientId,
      table.toolName,
      table.idempotencyKey
    ),
    index("admin_mcp_change_approvals_owner_idx").on(
      table.ownerAdminId,
      table.createdAt,
      table.id
    ),
    index("admin_mcp_change_approvals_expiry_idx").on(
      table.expiresAt,
      table.id
    ),
  ]
)

export const auditEvents = sqliteTable(
  "audit_events",
  {
    action: text("action", { enum: auditActionValues }).notNull(),
    actorId: text("actor_id").notNull(),
    category: text("category", { enum: auditCategoryValues }).notNull(),
    clientIp: text("client_ip"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey().notNull(),
    mcpApprovalId: text("mcp_approval_id"),
    mcpExecutionId: text("mcp_execution_id"),
    mcpInputDigest: text("mcp_input_digest"),
    mcpOauthClientId: text("mcp_oauth_client_id"),
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
      sql`${table.action} IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete', 'course.create', 'course.draft.save', 'course.publish', 'course.archive', 'course.restore')`
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
      sql`(${table.targetType} = 'learner' AND ${table.action} IN ('learner.detail.read', 'learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR (${table.targetType} = 'course' AND ${table.action} IN ('course.create', 'course.draft.save', 'course.publish', 'course.archive', 'course.restore'))`
    ),
    check(
      "audit_events_category_action_check",
      sql`(${table.category} = 'privacy-access' AND ${table.action} = 'learner.detail.read') OR (${table.category} = 'identity-mutation' AND ${table.action} IN ('learner.status.suspend', 'learner.status.activate', 'learner.delete')) OR (${table.category} = 'content-mutation' AND ${table.action} IN ('course.create', 'course.draft.save', 'course.publish', 'course.archive', 'course.restore'))`
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
    check(
      "audit_events_mcp_provenance_check",
      sql`(${table.mcpExecutionId} IS NULL AND ${table.mcpApprovalId} IS NULL AND ${table.mcpInputDigest} IS NULL AND ${table.mcpOauthClientId} IS NULL) OR (length(${table.mcpExecutionId}) BETWEEN 1 AND 200 AND ${table.mcpExecutionId} NOT GLOB '*[^A-Za-z0-9._:-]*' AND (${table.mcpApprovalId} IS NULL OR (length(${table.mcpApprovalId}) BETWEEN 1 AND 200 AND ${table.mcpApprovalId} NOT GLOB '*[^A-Za-z0-9._:-]*')) AND length(${table.mcpInputDigest}) = 64 AND ${table.mcpInputDigest} NOT GLOB '*[^a-f0-9]*' AND length(${table.mcpOauthClientId}) BETWEEN 1 AND 200)`
    ),
    index("audit_events_query_idx").on(table.createdAt, table.id),
    index("audit_events_retention_purge_idx").on(
      table.retentionUntil,
      table.id
    ),
  ]
)
