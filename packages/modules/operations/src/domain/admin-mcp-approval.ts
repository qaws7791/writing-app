import type {
  AdminMcpApprovalStatus,
  AdminMcpApprovalTarget,
  AdminMcpChangeToolName,
} from "@workspace/contracts/operations/admin-mcp-approvals"
import type { Failure } from "@workspace/kernel/failure"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { AdminId, AdminMcpApprovalId } from "@workspace/types/ids"

export const adminMcpApprovalStatusValues = [
  "pending",
  "approved",
  "rejected",
  "expired",
  "executing",
  "succeeded",
  "failed",
] as const satisfies readonly AdminMcpApprovalStatus[]

export const adminMcpChangeToolNameValues = [
  "admin_create_course_draft",
  "admin_archive_course",
  "admin_restore_course",
  "admin_publish_course",
  "admin_set_user_status",
  "admin_delete_user",
] as const satisfies readonly AdminMcpChangeToolName[]

export const adminMcpApprovalTargetKindValues = [
  "course-create",
  "course-lifecycle",
  "course-publish",
  "user-status",
  "user-delete",
] as const

export type AdminMcpApproval = Readonly<{
  completedAt: Date | null
  createdAt: Date
  decidedAt: Date | null
  executionStartedAt: Date | null
  expiresAt: Date
  failureCode: string | null
  id: AdminMcpApprovalId
  idempotencyKey: string
  inputDigest: string
  oauthClientId: string
  ownerAdminId: AdminId
  requestId: string
  status: AdminMcpApprovalStatus
  target: AdminMcpApprovalTarget
  toolName: AdminMcpChangeToolName
}>

export type AdminMcpApprovalError =
  | Failure<"admin-mcp-approval-binding-mismatch">
  | Failure<"admin-mcp-approval-conflict">
  | Failure<"admin-mcp-approval-expired">
  | Failure<"admin-mcp-approval-invalid">
  | Failure<"admin-mcp-approval-not-found">
  | Failure<"admin-mcp-approval-not-pending">
  | Failure<"admin-mcp-approval-persistence-failed">

export type CreateAdminMcpApprovalInput = Readonly<{
  createdAt: Date
  expiresAt: Date
  id: string
  idempotencyKey: string
  inputDigest: string
  oauthClientId: string
  ownerAdminId: AdminId
  requestId: string
  target: AdminMcpApprovalTarget
  toolName: AdminMcpChangeToolName
}>

const safeIdentifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u
const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/u
const sha256DigestPattern = /^[a-f0-9]{64}$/u
const failureCodePattern = /^[A-Z][A-Z0-9_]{0,99}$/u

export function createAdminMcpApproval(
  input: CreateAdminMcpApprovalInput
): Result<AdminMcpApproval, AdminMcpApprovalError> {
  if (
    !isFiniteDate(input.createdAt) ||
    !isFiniteDate(input.expiresAt) ||
    input.expiresAt.getTime() <= input.createdAt.getTime() ||
    !safeIdentifierPattern.test(input.id) ||
    !safeIdentifierPattern.test(input.ownerAdminId) ||
    !safeIdentifierPattern.test(input.requestId) ||
    !idempotencyKeyPattern.test(input.idempotencyKey) ||
    !sha256DigestPattern.test(input.inputDigest) ||
    input.oauthClientId.length < 1 ||
    input.oauthClientId.length > 200 ||
    !isValidTarget(input.target) ||
    !isCompatibleTarget(input)
  ) {
    return err({ kind: "admin-mcp-approval-invalid" })
  }

  return ok({
    completedAt: null,
    createdAt: new Date(input.createdAt),
    decidedAt: null,
    executionStartedAt: null,
    expiresAt: new Date(input.expiresAt),
    failureCode: null,
    id: input.id as AdminMcpApprovalId,
    idempotencyKey: input.idempotencyKey,
    inputDigest: input.inputDigest,
    oauthClientId: input.oauthClientId,
    ownerAdminId: input.ownerAdminId,
    requestId: input.requestId,
    status: "pending",
    target: input.target,
    toolName: input.toolName,
  })
}

function isValidTarget(target: AdminMcpApprovalTarget): boolean {
  switch (target.kind) {
    case "course-create":
    case "course-lifecycle":
    case "course-publish":
      return (
        safeIdentifierPattern.test(target.courseId) &&
        target.title.trim().length >= 1 &&
        target.title.length <= 200 &&
        Number.isInteger(target.editVersion) &&
        target.editVersion >= 0
      )
    case "user-status":
      return (
        safeIdentifierPattern.test(target.userId) &&
        target.expectedStatus !== target.targetStatus
      )
    case "user-delete":
      return safeIdentifierPattern.test(target.userId)
  }
}

function isCompatibleTarget(input: CreateAdminMcpApprovalInput): boolean {
  switch (input.toolName) {
    case "admin_create_course_draft":
      return input.target.kind === "course-create"
    case "admin_archive_course":
      return (
        input.target.kind === "course-lifecycle" &&
        input.target.expectedStatus === "active"
      )
    case "admin_restore_course":
      return (
        input.target.kind === "course-lifecycle" &&
        input.target.expectedStatus === "archived"
      )
    case "admin_publish_course":
      return input.target.kind === "course-publish"
    case "admin_set_user_status":
      return input.target.kind === "user-status"
    case "admin_delete_user":
      return input.target.kind === "user-delete"
  }
}

export function isAdminMcpApprovalExpired(
  approval: AdminMcpApproval,
  now: Date
): boolean {
  return (
    (approval.status === "pending" || approval.status === "approved") &&
    isFiniteDate(now) &&
    approval.expiresAt.getTime() <= now.getTime()
  )
}

export function isValidAdminMcpFailureCode(value: string): boolean {
  return failureCodePattern.test(value)
}

export function hasAdminMcpApprovalBinding(
  approval: AdminMcpApproval,
  binding: Readonly<{
    inputDigest: string
    oauthClientId: string
    ownerAdminId: AdminId
    toolName: AdminMcpChangeToolName
  }>
): boolean {
  return (
    approval.inputDigest === binding.inputDigest &&
    approval.oauthClientId === binding.oauthClientId &&
    approval.ownerAdminId === binding.ownerAdminId &&
    approval.toolName === binding.toolName
  )
}

function isFiniteDate(value: Date): boolean {
  return Number.isFinite(value.getTime())
}
