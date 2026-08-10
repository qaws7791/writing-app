import { courseIdSchema } from "@workspace/contracts/content/ids"
import {
  adminIdSchema,
  userIdSchema,
} from "@workspace/contracts/identity/admin-ids"
import { adminMcpApprovalIdSchema } from "@workspace/contracts/operations/admin-mcp-approvals"
import { adminMcpExecutionIdSchema } from "@workspace/contracts/operations/admin-mcp-executions"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createOperationsModule } from "#operations/module"

type TestDatabase = ReturnType<typeof createInMemoryWritingAppDatabase>

const ownerAdminId = adminIdSchema.parse("admin-owner")
const otherAdminId = adminIdSchema.parse("admin-other")
const courseId = courseIdSchema.parse("mcp-course-1")
const userId = userIdSchema.parse("mcp-user-1")
const inputDigest = "a".repeat(64)

let client: TestDatabase
let reportingClient: TestDatabase

beforeEach(() => {
  client = createInMemoryWritingAppDatabase()
  reportingClient = createInMemoryWritingAppDatabase()
  runCurrentTestMigration(client.sqlite)
})

afterEach(() => {
  reportingClient.close()
  client.close()
})

describe("admin MCP approvals", () => {
  it("persists a user deletion target without user profile data", async () => {
    const now = new Date("2026-08-10T00:00:00.000Z")
    const approvals = createOperationsModule({
      audit: {
        failureObserver: () => undefined,
        idGenerator: { next: () => "user-delete-approval" },
      },
      clock: { now: () => now },
      database: client.db,
      reportingDatabase: reportingClient.sqlite,
      reportingFailureObserver: () => undefined,
    }).adminMcpApprovals

    const requested = await approvals.request({
      expiresAt: new Date("2026-08-10T00:05:00.000Z"),
      idempotencyKey: "delete-user-approval-test",
      inputDigest,
      mcpCredentialId: "approved-mcp-credential",
      ownerAdminId,
      requestId: "mcp-user-delete-request",
      target: {
        expectedStatus: "active",
        kind: "user-delete",
        userId,
      },
      toolName: "admin_delete_user",
    })
    expect(requested.isOk()).toBe(true)
    if (requested.isErr()) return

    const read = await approvals.readForOwner({
      approvalId: requested.value.approval.id,
      ownerAdminId,
    })
    expect(read.isOk()).toBe(true)
    if (read.isErr()) return
    expect(read.value.target).toEqual({
      expectedStatus: "active",
      kind: "user-delete",
      userId,
    })
  })

  it("binds approval and execution to the owner, MCP credential, tool, and input", async () => {
    let now = new Date("2026-08-10T00:00:00.000Z")
    let idSequence = 0
    const approvals = createOperationsModule({
      audit: {
        failureObserver: () => undefined,
        idGenerator: { next: () => `test-${++idSequence}` },
      },
      clock: { now: () => now },
      database: client.db,
      reportingDatabase: reportingClient.sqlite,
      reportingFailureObserver: () => undefined,
    }).adminMcpApprovals
    const request = {
      expiresAt: new Date("2026-08-10T00:05:00.000Z"),
      idempotencyKey: "archive-course-test-1",
      inputDigest,
      mcpCredentialId: "approved-mcp-credential",
      ownerAdminId,
      requestId: "mcp-request-1",
      target: {
        courseId,
        editVersion: 3,
        expectedStatus: "active" as const,
        kind: "course-lifecycle" as const,
        title: "테스트 강의",
      },
      toolName: "admin_archive_course" as const,
    }

    const created = await approvals.request(request)
    expect(created.isOk()).toBe(true)
    if (created.isErr()) return
    expect(created.value.created).toBe(true)

    const replayedRequest = await approvals.request(request)
    expect(replayedRequest.isOk()).toBe(true)
    if (replayedRequest.isErr()) return
    expect(replayedRequest.value).toMatchObject({
      approval: { id: created.value.approval.id },
      created: false,
    })

    const hidden = await approvals.decide({
      approvalId: created.value.approval.id,
      decision: "approve",
      ownerAdminId: otherAdminId,
    })
    expect(hidden.isErr()).toBe(true)
    if (hidden.isOk()) return
    expect(hidden.error.kind).toBe("admin-mcp-approval-not-found")

    now = new Date("2026-08-10T00:01:00.000Z")
    const approved = await approvals.decide({
      approvalId: created.value.approval.id,
      decision: "approve",
      ownerAdminId,
    })
    expect(approved.isOk()).toBe(true)
    if (approved.isErr()) return
    expect(approved.value.status).toBe("approved")

    const mismatchedClaim = await approvals.claim({
      approvalId: approved.value.id,
      executionLeaseMs: 30_000,
      inputDigest,
      mcpCredentialId: "different-mcp-credential",
      ownerAdminId,
      toolName: "admin_archive_course",
    })
    expect(mismatchedClaim.isErr()).toBe(true)
    if (mismatchedClaim.isOk()) return
    expect(mismatchedClaim.error.kind).toBe(
      "admin-mcp-approval-binding-mismatch"
    )

    const acquired = await approvals.claim({
      approvalId: approved.value.id,
      executionLeaseMs: 30_000,
      inputDigest,
      mcpCredentialId: "approved-mcp-credential",
      ownerAdminId,
      toolName: "admin_archive_course",
    })
    expect(acquired.isOk()).toBe(true)
    if (acquired.isErr()) return
    expect(acquired.value.outcome).toBe("acquired")
    expect(acquired.value.approval.status).toBe("executing")

    const duplicateClaim = await approvals.claim({
      approvalId: approved.value.id,
      executionLeaseMs: 30_000,
      inputDigest,
      mcpCredentialId: "approved-mcp-credential",
      ownerAdminId,
      toolName: "admin_archive_course",
    })
    expect(duplicateClaim.isOk()).toBe(true)
    if (duplicateClaim.isErr()) return
    expect(duplicateClaim.value.outcome).toBe("in-progress")

    now = new Date("2026-08-10T00:01:01.000Z")
    const completed = await approvals.complete({
      approvalId: approved.value.id,
      failureCode: null,
      outcome: "succeeded",
    })
    expect(completed.isOk()).toBe(true)
    if (completed.isErr()) return
    expect(completed.value.status).toBe("succeeded")

    const completedClaim = await approvals.claim({
      approvalId: approved.value.id,
      executionLeaseMs: 30_000,
      inputDigest,
      mcpCredentialId: "approved-mcp-credential",
      ownerAdminId,
      toolName: "admin_archive_course",
    })
    expect(completedClaim.isOk()).toBe(true)
    if (completedClaim.isErr()) return
    expect(completedClaim.value.outcome).toBe("completed")
  })

  it("reuses one audit row with persisted MCP provenance", async () => {
    const now = new Date("2026-08-10T00:00:00.000Z")
    const auditTrail = createOperationsModule({
      audit: {
        failureObserver: () => undefined,
        idGenerator: { next: () => "unused-audit-id" },
      },
      clock: { now: () => now },
      database: client.db,
      reportingDatabase: reportingClient.sqlite,
      reportingFailureObserver: () => undefined,
    }).auditTrail
    const approvalId = adminMcpApprovalIdSchema.parse(
      "admin-mcp-approval-audit-1"
    )
    const executionId = adminMcpExecutionIdSchema.parse(approvalId)
    const command = {
      action: "course.archive" as const,
      actorId: ownerAdminId,
      approvalId,
      createdAt: now,
      eventId: "mcp-audit:0123456789abcdef0123456789abcdef",
      executionId,
      inputDigest,
      mcpCredentialId: "approved-mcp-credential",
      requestId: "mcp-request-1",
      target: { id: courseId, type: "course" as const },
    }

    const started = await auditTrail.ensureMcpStarted(command)
    expect(started.isOk()).toBe(true)
    if (started.isErr()) return
    expect(started.value.mcp).toEqual({
      approvalId,
      executionId,
      inputDigest,
      mcpCredentialId: "approved-mcp-credential",
    })

    const completed = await auditTrail.complete({
      eventId: started.value.id,
      outcome: "succeeded",
    })
    expect(completed.isOk()).toBe(true)

    const replayed = await auditTrail.ensureMcpStarted(command)
    expect(replayed.isOk()).toBe(true)
    if (replayed.isErr()) return
    expect(replayed.value).toMatchObject({
      id: started.value.id,
      outcome: "succeeded",
    })

    const page = await auditTrail.readEvents({
      actor: { id: ownerAdminId },
      category: "content-mutation",
      from: null,
      page: 1,
      pageSize: 10,
      to: null,
    })
    expect(page.isOk()).toBe(true)
    if (page.isErr()) return
    expect(page.value.items).toEqual([
      expect.objectContaining({
        mcp: {
          approvalId,
          executionId,
          inputDigest,
          mcpCredentialId: "approved-mcp-credential",
        },
        outcome: "succeeded",
      }),
    ])
  })
})
