import { and, eq, lte } from "drizzle-orm"
import type { WritingAppDatabase } from "@workspace/db/client"
import { err, ok } from "@workspace/kernel/result"
import type {
  AdminId,
  AdminMcpApprovalId,
  CourseId,
  UserId,
} from "@workspace/types/ids"

import type { AdminMcpApprovalRepository } from "#operations/application/ports/admin-mcp-approval-repository"
import {
  hasAdminMcpApprovalBinding,
  isAdminMcpApprovalExpired,
  type AdminMcpApproval,
  type AdminMcpApprovalError,
} from "#operations/domain/admin-mcp-approval"
import { adminMcpChangeApprovals } from "#operations/infrastructure/persistence/schema"

type ApprovalTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]
type ApprovalReadDatabase = Pick<WritingAppDatabase, "select">

export function createAdminMcpApprovalDrizzleRepository(
  database: WritingAppDatabase
): AdminMcpApprovalRepository {
  return {
    async claim(input) {
      try {
        return database.transaction((transaction) => {
          const current = readApproval(transaction, input.approvalId)
          if (current === null) return approvalError("not-found")
          if (!hasAdminMcpApprovalBinding(current, input)) {
            return approvalError("binding-mismatch")
          }

          const approval = expireApproval(transaction, current, input.now)
          if (approval.status === "expired") {
            return approvalError("expired")
          }
          if (approval.status === "pending") {
            return ok({ approval, outcome: "awaiting-approval" as const })
          }
          if (approval.status === "succeeded" || approval.status === "failed") {
            return ok({ approval, outcome: "completed" as const })
          }
          if (approval.status === "rejected") {
            return approvalError("not-pending")
          }
          if (
            approval.status === "executing" &&
            approval.executionStartedAt !== null &&
            approval.executionStartedAt.getTime() >
              input.executionLeaseCutoff.getTime()
          ) {
            return ok({ approval, outcome: "in-progress" as const })
          }

          const acquired = transaction
            .update(adminMcpChangeApprovals)
            .set({ executionStartedAt: input.now, status: "executing" })
            .where(
              and(
                eq(adminMcpChangeApprovals.id, approval.id),
                approval.status === "approved"
                  ? eq(adminMcpChangeApprovals.status, "approved")
                  : and(
                      eq(adminMcpChangeApprovals.status, "executing"),
                      lte(
                        adminMcpChangeApprovals.executionStartedAt,
                        input.executionLeaseCutoff
                      )
                    )
              )
            )
            .returning()
            .get()
          return acquired === undefined
            ? approvalError("conflict")
            : ok({
                approval: toAdminMcpApproval(acquired),
                outcome: "acquired" as const,
              })
        })
      } catch (cause) {
        return persistenceFailure(cause)
      }
    },
    async complete(input) {
      try {
        return database.transaction((transaction) => {
          const current = readApproval(transaction, input.approvalId)
          if (current === null) return approvalError("not-found")
          if (current.status === input.outcome) {
            return current.failureCode === input.failureCode
              ? ok(current)
              : approvalError("conflict")
          }
          if (current.status !== "executing") {
            return approvalError("conflict")
          }

          const updated = transaction
            .update(adminMcpChangeApprovals)
            .set({
              completedAt: input.now,
              failureCode: input.failureCode,
              status: input.outcome,
            })
            .where(
              and(
                eq(adminMcpChangeApprovals.id, input.approvalId),
                eq(adminMcpChangeApprovals.status, "executing")
              )
            )
            .returning()
            .get()
          return updated === undefined
            ? approvalError("conflict")
            : ok(toAdminMcpApproval(updated))
        })
      } catch (cause) {
        return persistenceFailure(cause)
      }
    },
    async createOrRead(approval) {
      try {
        return database.transaction((transaction) => {
          const existing = transaction
            .select()
            .from(adminMcpChangeApprovals)
            .where(
              and(
                eq(adminMcpChangeApprovals.ownerAdminId, approval.ownerAdminId),
                eq(
                  adminMcpChangeApprovals.oauthClientId,
                  approval.oauthClientId
                ),
                eq(adminMcpChangeApprovals.toolName, approval.toolName),
                eq(
                  adminMcpChangeApprovals.idempotencyKey,
                  approval.idempotencyKey
                )
              )
            )
            .get()
          if (existing !== undefined) {
            const current = toAdminMcpApproval(existing)
            return current.inputDigest === approval.inputDigest
              ? ok({ approval: current, created: false })
              : approvalError("conflict")
          }

          transaction
            .insert(adminMcpChangeApprovals)
            .values(toApprovalRow(approval))
            .run()
          return ok({ approval, created: true })
        })
      } catch (cause) {
        if (isUniqueConstraintViolation(cause)) {
          const existing = readApprovalByIdempotency(database, approval)
          return existing !== null &&
            existing.inputDigest === approval.inputDigest
            ? ok({ approval: existing, created: false })
            : approvalError("conflict")
        }
        return persistenceFailure(cause)
      }
    },
    async decide(input) {
      try {
        return database.transaction((transaction) => {
          const current = readApproval(transaction, input.approvalId)
          if (current === null || current.ownerAdminId !== input.ownerAdminId) {
            return approvalError("not-found")
          }
          const approval = expireApproval(transaction, current, input.now)
          if (approval.status === "expired") {
            return approvalError("expired")
          }
          const nextStatus =
            input.decision === "approve" ? "approved" : "rejected"
          if (approval.status === nextStatus) return ok(approval)
          if (approval.status !== "pending") {
            return approvalError("not-pending")
          }

          const updated = transaction
            .update(adminMcpChangeApprovals)
            .set({ decidedAt: input.now, status: nextStatus })
            .where(
              and(
                eq(adminMcpChangeApprovals.id, input.approvalId),
                eq(adminMcpChangeApprovals.ownerAdminId, input.ownerAdminId),
                eq(adminMcpChangeApprovals.status, "pending")
              )
            )
            .returning()
            .get()
          return updated === undefined
            ? approvalError("conflict")
            : ok(toAdminMcpApproval(updated))
        })
      } catch (cause) {
        return persistenceFailure(cause)
      }
    },
    async readForOwner(input) {
      try {
        return database.transaction((transaction) => {
          const current = readApproval(transaction, input.approvalId)
          if (current === null || current.ownerAdminId !== input.ownerAdminId) {
            return approvalError("not-found")
          }
          return ok(expireApproval(transaction, current, input.now))
        })
      } catch (cause) {
        return persistenceFailure(cause)
      }
    },
  }
}

function expireApproval(
  transaction: ApprovalTransaction,
  approval: AdminMcpApproval,
  now: Date
): AdminMcpApproval {
  if (!isAdminMcpApprovalExpired(approval, now)) return approval

  const expired = transaction
    .update(adminMcpChangeApprovals)
    .set({ completedAt: now, status: "expired" })
    .where(
      and(
        eq(adminMcpChangeApprovals.id, approval.id),
        eq(adminMcpChangeApprovals.status, approval.status)
      )
    )
    .returning()
    .get()
  return expired === undefined ? approval : toAdminMcpApproval(expired)
}

function readApproval(
  database: ApprovalReadDatabase,
  approvalId: AdminMcpApprovalId
): AdminMcpApproval | null {
  const row = database
    .select()
    .from(adminMcpChangeApprovals)
    .where(eq(adminMcpChangeApprovals.id, approvalId))
    .get()
  return row === undefined ? null : toAdminMcpApproval(row)
}

function readApprovalByIdempotency(
  database: ApprovalReadDatabase,
  approval: AdminMcpApproval
): AdminMcpApproval | null {
  const row = database
    .select()
    .from(adminMcpChangeApprovals)
    .where(
      and(
        eq(adminMcpChangeApprovals.ownerAdminId, approval.ownerAdminId),
        eq(adminMcpChangeApprovals.oauthClientId, approval.oauthClientId),
        eq(adminMcpChangeApprovals.toolName, approval.toolName),
        eq(adminMcpChangeApprovals.idempotencyKey, approval.idempotencyKey)
      )
    )
    .get()
  return row === undefined ? null : toAdminMcpApproval(row)
}

function toApprovalRow(approval: AdminMcpApproval) {
  const courseTarget =
    approval.target.kind === "course-create" ||
    approval.target.kind === "course-lifecycle" ||
    approval.target.kind === "course-publish"
      ? approval.target
      : null
  const userTarget =
    approval.target.kind === "user-status" ||
    approval.target.kind === "user-delete"
      ? approval.target
      : null
  return {
    completedAt: approval.completedAt,
    createdAt: approval.createdAt,
    decidedAt: approval.decidedAt,
    executionStartedAt: approval.executionStartedAt,
    expectedCourseStatus:
      approval.target.kind === "course-lifecycle"
        ? approval.target.expectedStatus
        : null,
    expectedUserStatus: userTarget?.expectedStatus ?? null,
    expiresAt: approval.expiresAt,
    failureCode: approval.failureCode,
    id: approval.id,
    idempotencyKey: approval.idempotencyKey,
    inputDigest: approval.inputDigest,
    oauthClientId: approval.oauthClientId,
    ownerAdminId: approval.ownerAdminId,
    requestId: approval.requestId,
    status: approval.status,
    targetCourseId: courseTarget?.courseId ?? null,
    targetEditVersion: courseTarget?.editVersion ?? null,
    targetKind: approval.target.kind,
    targetTitle: courseTarget?.title ?? null,
    targetUserId: userTarget?.userId ?? null,
    targetUserStatus:
      approval.target.kind === "user-status"
        ? approval.target.targetStatus
        : null,
    toolName: approval.toolName,
  }
}

function toAdminMcpApproval(
  row: typeof adminMcpChangeApprovals.$inferSelect
): AdminMcpApproval {
  return {
    completedAt: row.completedAt === null ? null : new Date(row.completedAt),
    createdAt: new Date(row.createdAt),
    decidedAt: row.decidedAt === null ? null : new Date(row.decidedAt),
    executionStartedAt:
      row.executionStartedAt === null ? null : new Date(row.executionStartedAt),
    expiresAt: new Date(row.expiresAt),
    failureCode: row.failureCode,
    id: row.id as AdminMcpApprovalId,
    idempotencyKey: row.idempotencyKey,
    inputDigest: row.inputDigest,
    oauthClientId: row.oauthClientId,
    ownerAdminId: row.ownerAdminId as AdminId,
    requestId: row.requestId,
    status: row.status,
    target: readApprovalTarget(row),
    toolName: row.toolName,
  }
}

function readApprovalTarget(
  row: typeof adminMcpChangeApprovals.$inferSelect
): AdminMcpApproval["target"] {
  switch (row.targetKind) {
    case "course-create":
      return {
        courseId: requiredCourseId(row),
        editVersion: requiredEditVersion(row),
        kind: "course-create",
        title: requiredTitle(row),
      }
    case "course-lifecycle":
      return {
        courseId: requiredCourseId(row),
        editVersion: requiredEditVersion(row),
        expectedStatus: readExpectedCourseStatus(row),
        kind: "course-lifecycle",
        title: requiredTitle(row),
      }
    case "course-publish":
      return {
        courseId: requiredCourseId(row),
        editVersion: requiredEditVersion(row),
        kind: "course-publish",
        title: requiredTitle(row),
      }
    case "user-status":
      return {
        expectedStatus: readExpectedUserStatus(row),
        kind: "user-status",
        targetStatus: readTargetUserStatus(row),
        userId: requiredUserId(row),
      }
    case "user-delete":
      return {
        expectedStatus: readExpectedUserStatus(row),
        kind: "user-delete",
        userId: requiredUserId(row),
      }
  }
}

function requiredCourseId(
  row: typeof adminMcpChangeApprovals.$inferSelect
): CourseId {
  if (row.targetCourseId !== null) return row.targetCourseId as CourseId
  throw new Error(`Invalid course approval target: ${row.id}`)
}

function requiredEditVersion(
  row: typeof adminMcpChangeApprovals.$inferSelect
): number {
  if (row.targetEditVersion !== null) return row.targetEditVersion
  throw new Error(`Invalid course approval target: ${row.id}`)
}

function requiredTitle(
  row: typeof adminMcpChangeApprovals.$inferSelect
): string {
  if (row.targetTitle !== null) return row.targetTitle
  throw new Error(`Invalid course approval target: ${row.id}`)
}

function requiredUserId(
  row: typeof adminMcpChangeApprovals.$inferSelect
): UserId {
  if (row.targetUserId !== null) return row.targetUserId as UserId
  throw new Error(`Invalid user approval target: ${row.id}`)
}

function readExpectedUserStatus(
  row: typeof adminMcpChangeApprovals.$inferSelect
): "active" | "suspended" {
  if (
    row.expectedUserStatus === "active" ||
    row.expectedUserStatus === "suspended"
  ) {
    return row.expectedUserStatus
  }
  throw new Error(`Invalid user approval target: ${row.id}`)
}

function readTargetUserStatus(
  row: typeof adminMcpChangeApprovals.$inferSelect
): "active" | "suspended" {
  if (
    row.targetUserStatus === "active" ||
    row.targetUserStatus === "suspended"
  ) {
    return row.targetUserStatus
  }
  throw new Error(`Invalid user status approval target: ${row.id}`)
}

function readExpectedCourseStatus(
  row: typeof adminMcpChangeApprovals.$inferSelect
): "active" | "archived" {
  if (
    row.expectedCourseStatus === "active" ||
    row.expectedCourseStatus === "archived"
  ) {
    return row.expectedCourseStatus
  }
  throw new Error(`Invalid lifecycle approval target: ${row.id}`)
}

function approvalError(
  reason:
    | "binding-mismatch"
    | "conflict"
    | "expired"
    | "not-found"
    | "not-pending"
) {
  const kinds = {
    "binding-mismatch": "admin-mcp-approval-binding-mismatch",
    conflict: "admin-mcp-approval-conflict",
    expired: "admin-mcp-approval-expired",
    "not-found": "admin-mcp-approval-not-found",
    "not-pending": "admin-mcp-approval-not-pending",
  } as const
  return err({ kind: kinds[reason] } satisfies AdminMcpApprovalError)
}

function persistenceFailure(cause: unknown) {
  return err({
    cause,
    kind: "admin-mcp-approval-persistence-failed",
  } satisfies AdminMcpApprovalError)
}

function isUniqueConstraintViolation(cause: unknown): boolean {
  return (
    cause instanceof Error && cause.message.includes("UNIQUE constraint failed")
  )
}
