import type { AiFeedbackMaintenance } from "@workspace/ai-feedback/maintenance"
import {
  contentAssetOrphanRetentionMs,
  type CleanupOrphanedAssets,
} from "@workspace/content/maintenance"
import type { DeletedLearnerPurgeCommand } from "@workspace/identity/purge"
import type { Clock } from "@workspace/kernel/clock"
import type { Failure } from "@workspace/kernel/failure"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { AuditTrail } from "@workspace/operations/audit"

import type { ExpiredSessionMaintenance } from "@/maintenance/expired-session-maintenance"
import type { ExternalLogRetentionEvidence } from "@/maintenance/log-retention-evidence"

const dayMs = 24 * 60 * 60 * 1_000
const applicationRequestLogRetentionMs = 30 * dayMs
const securityLogRetentionMs = 90 * dayMs

type MaintenanceStage =
  | "ai-pending"
  | "audit"
  | "content-assets"
  | "deleted-learners"
  | "expired-sessions"
  | "input"

export type DailyMaintenanceError = Failure<
  "daily-maintenance-failed",
  {
    readonly cutoff: Date
    readonly stage: MaintenanceStage
  }
>

type BatchResult = Readonly<{
  affected: number
  cutoff: Date
  matched: number
}>

export type DailyMaintenanceResult = Readonly<{
  batchSize: number
  dryRun: boolean
  externalLogRetention: Readonly<{
    applicationRequest: Readonly<{
      cutoff: Date
      requiredMaximumDays: 30
    }>
    evidence:
      | Readonly<{
          evidenceId: string
          sink: string
          status: "verified"
          validUntil: Date
          verifiedAt: Date
        }>
      | Readonly<{ status: "unverified" }>
    security: Readonly<{
      cutoff: Date
      requiredMaximumDays: 90
    }>
  }>
  occurredAt: Date
  stages: Readonly<{
    aiPending: BatchResult
    audit: BatchResult
    contentAssets: BatchResult & Readonly<{ retained: number }>
    deletedLearners: BatchResult
    expiredSessions: BatchResult
  }>
}>

export function createDailyMaintenance(input: {
  readonly aiFeedback: AiFeedbackMaintenance
  readonly auditTrail: AuditTrail
  readonly clock: Clock
  readonly contentAssets: CleanupOrphanedAssets
  readonly deletedLearners: DeletedLearnerPurgeCommand
  readonly expiredSessions: ExpiredSessionMaintenance
  readonly externalLogRetentionEvidence: ExternalLogRetentionEvidence | null
}) {
  return {
    async execute(command: {
      readonly batchSize: number
      readonly dryRun: boolean
    }): Promise<Result<DailyMaintenanceResult, DailyMaintenanceError>> {
      const occurredAt = input.clock.now()
      if (
        !Number.isFinite(occurredAt.getTime()) ||
        !Number.isInteger(command.batchSize) ||
        command.batchSize < 1 ||
        command.batchSize > 1_000
      ) {
        return err({
          cutoff: occurredAt,
          kind: "daily-maintenance-failed",
          stage: "input",
        })
      }

      const deletedLearners = await input.deletedLearners.execute({
        batchSize: command.batchSize,
        dryRun: command.dryRun,
      })
      if (deletedLearners.isErr()) {
        return maintenanceError(
          "deleted-learners",
          occurredAt,
          deletedLearners.error
        )
      }

      const expiredSessions = await input.expiredSessions.cleanup({
        batchSize: command.batchSize,
        cutoff: occurredAt,
        dryRun: command.dryRun,
      })
      if (expiredSessions.isErr()) {
        return maintenanceError(
          "expired-sessions",
          occurredAt,
          expiredSessions.error
        )
      }

      const aiPending = await input.aiFeedback.expireStalePending({
        batchSize: command.batchSize,
        dryRun: command.dryRun,
      })
      if (aiPending.isErr()) {
        return maintenanceError("ai-pending", occurredAt, aiPending.error)
      }

      const auditMatched = await input.auditTrail.inspectExpired({
        batchSize: command.batchSize,
        cutoff: occurredAt,
      })
      if (auditMatched.isErr()) {
        return maintenanceError("audit", occurredAt, auditMatched.error)
      }
      const auditAffected = command.dryRun
        ? ok(0)
        : await input.auditTrail.purgeExpired({
            batchSize: command.batchSize,
            cutoff: occurredAt,
          })
      if (auditAffected.isErr()) {
        return maintenanceError("audit", occurredAt, auditAffected.error)
      }

      const contentAssetCutoff = new Date(
        occurredAt.getTime() - contentAssetOrphanRetentionMs
      )
      const contentAssets = await input.contentAssets({
        batchSize: command.batchSize,
        cutoff: contentAssetCutoff,
        dryRun: command.dryRun,
      })
      if (contentAssets.isErr()) {
        return maintenanceError(
          "content-assets",
          contentAssetCutoff,
          contentAssets.error
        )
      }

      return ok({
        batchSize: command.batchSize,
        dryRun: command.dryRun,
        externalLogRetention: createExternalLogRetentionReport({
          evidence: input.externalLogRetentionEvidence,
          occurredAt,
        }),
        occurredAt: new Date(occurredAt),
        stages: {
          aiPending: batchResult({
            affected: aiPending.value.expiredAttempts,
            cutoff: aiPending.value.cutoff,
            matched: aiPending.value.matchedAttempts,
          }),
          audit: batchResult({
            affected: auditAffected.value,
            cutoff: occurredAt,
            matched: auditMatched.value,
          }),
          contentAssets: {
            ...batchResult({
              affected: contentAssets.value.deleted,
              cutoff: contentAssetCutoff,
              matched: contentAssets.value.scanned,
            }),
            retained: contentAssets.value.retained,
          },
          deletedLearners: batchResult({
            affected: deletedLearners.value.purgedUserCount,
            cutoff: deletedLearners.value.cutoff,
            matched: deletedLearners.value.matchedUserCount,
          }),
          expiredSessions: batchResult({
            affected: expiredSessions.value.deletedSessions,
            cutoff: occurredAt,
            matched: expiredSessions.value.matchedSessions,
          }),
        },
      })
    },
  }
}

function maintenanceError(
  stage: MaintenanceStage,
  cutoff: Date,
  cause: unknown
): Result<never, DailyMaintenanceError> {
  return err({
    cause,
    cutoff: new Date(cutoff),
    kind: "daily-maintenance-failed",
    stage,
  })
}

function batchResult(input: BatchResult): BatchResult {
  return { ...input, cutoff: new Date(input.cutoff) }
}

function createExternalLogRetentionReport(input: {
  readonly evidence: ExternalLogRetentionEvidence | null
  readonly occurredAt: Date
}): DailyMaintenanceResult["externalLogRetention"] {
  return {
    applicationRequest: {
      cutoff: new Date(
        input.occurredAt.getTime() - applicationRequestLogRetentionMs
      ),
      requiredMaximumDays: 30 as const,
    },
    evidence:
      input.evidence === null
        ? { status: "unverified" as const }
        : {
            evidenceId: input.evidence.evidenceId,
            sink: input.evidence.sink,
            status: "verified" as const,
            validUntil: new Date(input.evidence.validUntil),
            verifiedAt: new Date(input.evidence.verifiedAt),
          },
    security: {
      cutoff: new Date(input.occurredAt.getTime() - securityLogRetentionMs),
      requiredMaximumDays: 90 as const,
    },
  }
}
