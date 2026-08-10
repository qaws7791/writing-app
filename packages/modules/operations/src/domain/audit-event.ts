import type { Result } from "@workspace/kernel/result"
import { err, ok } from "@workspace/kernel/result"
import type {
  AdminId,
  AdminMcpApprovalId,
  AdminMcpExecutionId,
  CourseId,
  UserId,
} from "@workspace/types/ids"

declare const auditEventIdBrand: unique symbol

export type AuditEventId = string & {
  readonly [auditEventIdBrand]: "AuditEventId"
}

export const auditCategoryValues = [
  "privacy-access",
  "identity-mutation",
  "content-mutation",
] as const

export type AuditCategory = (typeof auditCategoryValues)[number]

export const auditActionValues = [
  "learner.detail.read",
  "learner.status.suspend",
  "learner.status.activate",
  "learner.delete",
  "course.create",
  "course.draft.save",
  "course.publish",
  "course.archive",
  "course.restore",
] as const

export type AuditAction = (typeof auditActionValues)[number]

export const auditOutcomeValues = ["started", "succeeded", "failed"] as const

type AuditOutcome = (typeof auditOutcomeValues)[number]

export const auditTargetTypeValues = ["learner", "course"] as const

export type AuditTarget =
  | Readonly<{ id: CourseId; type: "course" }>
  | Readonly<{ id: UserId; type: "learner" }>

type AuditMcpProvenance = Readonly<{
  approvalId: AdminMcpApprovalId | null
  executionId: AdminMcpExecutionId
  inputDigest: string
  mcpCredentialId: string
}>

export type AuditEvent = Readonly<{
  action: AuditAction
  actorId: AdminId
  category: AuditCategory
  clientIp: string | null
  createdAt: Date
  id: AuditEventId
  mcp: AuditMcpProvenance | null
  outcome: AuditOutcome
  requestId: string
  retentionUntil: Date
  target: AuditTarget
}>

export type AuditEventValidationError = Readonly<{
  kind: "invalid-audit-event"
}>

export type StartAuditEventInput = Readonly<{
  action: AuditAction
  actorId: AdminId
  clientIp: string | null
  createdAt: Date
  id: string
  mcp?: AuditMcpProvenance | null
  requestId: string
  target: AuditTarget
}>

const applicationAuditRetentionMs = 365 * 24 * 60 * 60 * 1_000
const highRiskAuditRetentionMs = 3 * applicationAuditRetentionMs
const safeAuditIdentifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u
const safeClientIpPattern = /^[0-9A-Fa-f:.]{2,45}$/u
const sha256HexPattern = /^[a-f0-9]{64}$/u

const auditPolicies = {
  "course.create": {
    category: "content-mutation",
    retentionMs: applicationAuditRetentionMs,
    targetType: "course",
  },
  "course.draft.save": {
    category: "content-mutation",
    retentionMs: applicationAuditRetentionMs,
    targetType: "course",
  },
  "course.archive": {
    category: "content-mutation",
    retentionMs: applicationAuditRetentionMs,
    targetType: "course",
  },
  "course.publish": {
    category: "content-mutation",
    retentionMs: applicationAuditRetentionMs,
    targetType: "course",
  },
  "course.restore": {
    category: "content-mutation",
    retentionMs: applicationAuditRetentionMs,
    targetType: "course",
  },
  "learner.delete": {
    category: "identity-mutation",
    retentionMs: highRiskAuditRetentionMs,
    targetType: "learner",
  },
  "learner.detail.read": {
    category: "privacy-access",
    retentionMs: applicationAuditRetentionMs,
    targetType: "learner",
  },
  "learner.status.activate": {
    category: "identity-mutation",
    retentionMs: highRiskAuditRetentionMs,
    targetType: "learner",
  },
  "learner.status.suspend": {
    category: "identity-mutation",
    retentionMs: highRiskAuditRetentionMs,
    targetType: "learner",
  },
} as const satisfies Readonly<
  Record<
    AuditAction,
    Readonly<{
      category: AuditCategory
      retentionMs: number
      targetType: AuditTarget["type"]
    }>
  >
>

export function createStartedAuditEvent(
  input: StartAuditEventInput
): Result<AuditEvent, AuditEventValidationError> {
  const policy = auditPolicies[input.action]
  const createdAtMs = input.createdAt.getTime()

  if (
    !Number.isFinite(createdAtMs) ||
    policy.targetType !== input.target.type ||
    !isSafeAuditIdentifier(input.id) ||
    !isSafeAuditIdentifier(input.actorId) ||
    !isSafeAuditIdentifier(input.target.id) ||
    !isSafeAuditIdentifier(input.requestId) ||
    !isSafeClientIp(input.clientIp) ||
    !isValidMcpProvenance(input.mcp ?? null)
  ) {
    return err({ kind: "invalid-audit-event" })
  }

  return ok({
    action: input.action,
    actorId: input.actorId,
    category: policy.category,
    clientIp: input.clientIp,
    createdAt: new Date(createdAtMs),
    id: input.id as AuditEventId,
    mcp: input.mcp ?? null,
    outcome: "started",
    requestId: input.requestId,
    retentionUntil: new Date(createdAtMs + policy.retentionMs),
    target: input.target,
  })
}

function isSafeAuditIdentifier(value: string): boolean {
  return safeAuditIdentifierPattern.test(value)
}

function isSafeClientIp(value: string | null): boolean {
  return value === null || safeClientIpPattern.test(value)
}

function isValidMcpProvenance(value: AuditMcpProvenance | null): boolean {
  return (
    value === null ||
    (isSafeAuditIdentifier(value.executionId) &&
      (value.approvalId === null || isSafeAuditIdentifier(value.approvalId)) &&
      sha256HexPattern.test(value.inputDigest) &&
      value.mcpCredentialId.length >= 1 &&
      value.mcpCredentialId.length <= 200)
  )
}
