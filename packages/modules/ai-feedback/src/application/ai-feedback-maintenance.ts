import type { Clock } from "@workspace/kernel/clock"
import { err, type Result } from "@workspace/kernel/result"

export type ExpireStaleAiFeedbackResult = Readonly<{
  cutoff: Date
  expiredAttempts: number
  matchedAttempts: number
}>

type ExpireStaleAiFeedbackCounts = Readonly<{
  expiredAttempts: number
  matchedAttempts: number
}>

export type AiFeedbackMaintenanceError =
  | Readonly<{
      batchSize: number
      kind: "invalid-batch-size"
      maximum: 1_000
      minimum: 1
    }>
  | Readonly<{
      cause: unknown
      kind: "ai-feedback-maintenance-failed"
    }>

export type AiFeedbackMaintenanceRepository = Readonly<{
  expireStalePending: (input: {
    readonly batchSize: number
    readonly dryRun: boolean
    readonly occurredAt: Date
  }) => Promise<Result<ExpireStaleAiFeedbackCounts, AiFeedbackMaintenanceError>>
}>

export type AiFeedbackMaintenance = Readonly<{
  expireStalePending: (input: {
    readonly batchSize: number
    readonly dryRun?: boolean
  }) => Promise<Result<ExpireStaleAiFeedbackResult, AiFeedbackMaintenanceError>>
}>

export function createAiFeedbackMaintenance(input: {
  readonly clock: Clock
  readonly repository: AiFeedbackMaintenanceRepository
}): AiFeedbackMaintenance {
  return {
    async expireStalePending(options) {
      if (
        !Number.isInteger(options.batchSize) ||
        options.batchSize < 1 ||
        options.batchSize > 1_000
      ) {
        return err({
          batchSize: options.batchSize,
          kind: "invalid-batch-size",
          maximum: 1_000,
          minimum: 1,
        })
      }

      const cutoff = input.clock.now()
      return (
        await input.repository.expireStalePending({
          batchSize: options.batchSize,
          dryRun: options.dryRun ?? false,
          occurredAt: cutoff,
        })
      ).map((result) => ({
        ...result,
        cutoff,
      }))
    },
  }
}
