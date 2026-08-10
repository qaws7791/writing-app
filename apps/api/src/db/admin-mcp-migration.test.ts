import { Database } from "bun:sqlite"

import { afterEach, describe, expect, it } from "vitest"

import currentSchemaBaselineSql from "../../drizzle/0000-current-schema-baseline.sql" with { type: "text" }
import reportingViewsSql from "../../drizzle/0001-reporting-views.sql" with { type: "text" }
import auditEventsCourseRestoreSql from "../../drizzle/0002-audit-events-course-restore.sql" with { type: "text" }
import focusedWritingSql from "../../drizzle/0003-focused-writing.sql" with { type: "text" }
import adminMcpApprovedContentChangesSql from "../../drizzle/0004-admin-mcp-approved-content-changes.sql" with { type: "text" }
import adminMcpFullAdminToolsSql from "../../drizzle/0005-admin-mcp-full-admin-tools.sql" with { type: "text" }

const openDatabases: Database[] = []

afterEach(() => {
  for (const database of openDatabases.splice(0)) database.close()
})

describe("admin MCP application migration", () => {
  it("preserves existing audit rows while adding approval provenance", () => {
    const database = new Database(":memory:")
    openDatabases.push(database)
    database.exec(currentSchemaBaselineSql)
    database.exec(reportingViewsSql)
    database.exec(auditEventsCourseRestoreSql)
    database.exec(focusedWritingSql)
    const createdAt = Date.parse("2026-08-10T00:00:00.000Z")
    database
      .query(
        `INSERT INTO audit_events (
          action,
          actor_id,
          category,
          client_ip,
          created_at,
          id,
          outcome,
          request_id,
          retention_until,
          target_id,
          target_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        "course.publish",
        "admin-owner",
        "content-mutation",
        null,
        createdAt,
        "audit-before-admin-mcp",
        "succeeded",
        "request-before-admin-mcp",
        createdAt + 365 * 24 * 60 * 60 * 1_000,
        "course-1",
        "course"
      )

    database.exec(adminMcpApprovedContentChangesSql)
    database
      .query(
        `INSERT INTO audit_events (
          action,
          actor_id,
          category,
          client_ip,
          created_at,
          id,
          mcp_approval_id,
          mcp_input_digest,
          mcp_oauth_client_id,
          outcome,
          request_id,
          retention_until,
          target_id,
          target_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        "course.archive",
        "admin-owner",
        "content-mutation",
        null,
        createdAt,
        "audit-before-full-tools",
        "admin-mcp-approval-before-full-tools",
        "a".repeat(64),
        "approved-agent-client",
        "succeeded",
        "request-before-full-tools",
        createdAt + 365 * 24 * 60 * 60 * 1_000,
        "course-1",
        "course"
      )
    database
      .query(
        `INSERT INTO content_mcp_change_receipts (
          actor_id,
          approval_id,
          created_at,
          input_digest,
          oauth_client_id,
          result_kind,
          target_course_id,
          tool_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        "admin-owner",
        "admin-mcp-approval-before-full-tools",
        createdAt,
        "a".repeat(64),
        "approved-agent-client",
        "course-archived",
        "course-1",
        "admin_archive_course"
      )
    database.exec(adminMcpFullAdminToolsSql)

    expect(
      database
        .query<
          {
            action: string
            mcpApprovalId: string | null
            mcpExecutionId: string | null
            mcpInputDigest: string | null
            mcpOauthClientId: string | null
            outcome: string
          },
          []
        >(
          `SELECT
            action,
            mcp_approval_id AS mcpApprovalId,
            mcp_execution_id AS mcpExecutionId,
            mcp_input_digest AS mcpInputDigest,
            mcp_oauth_client_id AS mcpOauthClientId,
            outcome
          FROM audit_events
          WHERE id = 'audit-before-admin-mcp'`
        )
        .get()
    ).toEqual({
      action: "course.publish",
      mcpApprovalId: null,
      mcpExecutionId: null,
      mcpInputDigest: null,
      mcpOauthClientId: null,
      outcome: "succeeded",
    })
    expect(
      database
        .query<{ mcpApprovalId: string; mcpExecutionId: string }, []>(
          `SELECT
            mcp_approval_id AS mcpApprovalId,
            mcp_execution_id AS mcpExecutionId
          FROM audit_events
          WHERE id = 'audit-before-full-tools'`
        )
        .get()
    ).toEqual({
      mcpApprovalId: "admin-mcp-approval-before-full-tools",
      mcpExecutionId: "admin-mcp-approval-before-full-tools",
    })
    expect(
      database
        .query<{ executionId: string }, []>(
          `SELECT execution_id AS executionId
          FROM content_mcp_change_receipts
          WHERE approval_id = 'admin-mcp-approval-before-full-tools'`
        )
        .get()
    ).toEqual({
      executionId: "admin-mcp-approval-before-full-tools",
    })
    expect(
      database
        .query<{ name: string }, []>(
          `SELECT name
          FROM sqlite_master
          WHERE type = 'table'
            AND name IN (
              'admin_mcp_change_approvals',
              'content_mcp_automatic_change_receipts',
              'content_mcp_change_receipts'
            )
          ORDER BY name`
        )
        .all()
        .map(({ name }) => name)
    ).toEqual([
      "admin_mcp_change_approvals",
      "content_mcp_automatic_change_receipts",
      "content_mcp_change_receipts",
    ])
    expect(database.query("PRAGMA foreign_key_check").all()).toEqual([])
  })
})
