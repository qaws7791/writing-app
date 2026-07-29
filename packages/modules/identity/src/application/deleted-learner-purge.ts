import type { Clock } from "@workspace/kernel/clock"
import { err, ok, type Result } from "@workspace/kernel/result"

import type {
  DeletedLearnerPurgeRepository,
  DeletedLearnerPurgeRepositoryError,
} from "#identity/application/identity-ports"
import { calculateDeletedLearnerPurgeCutoff } from "#identity/domain/deleted-learner-retention"

type DeletedLearnerPurgeResult = Readonly<{
  cutoff: Date
  matchedUserCount: number
  purgedUserCount: number
}>

export type DeletedLearnerPurgeCommand = Readonly<{
  execute: (input?: {
    readonly batchSize?: number
    readonly dryRun?: boolean
  }) => Promise<
    Result<DeletedLearnerPurgeResult, DeletedLearnerPurgeRepositoryError>
  >
}>

export function createDeletedLearnerPurgeCommand(input: {
  readonly clock: Clock
  readonly repository: DeletedLearnerPurgeRepository
}): DeletedLearnerPurgeCommand {
  return {
    async execute(options = {}) {
      const cutoff = calculateDeletedLearnerPurgeCutoff(input.clock.now())
      const result = await input.repository.purgeDeletedBefore({
        batchSize: options.batchSize ?? 1_000,
        cutoff,
        dryRun: options.dryRun ?? false,
      })
      if (result.isErr()) return err(result.error)

      return ok({
        cutoff,
        matchedUserCount: result.value.matchedUserCount,
        purgedUserCount: result.value.purgedUserCount,
      })
    },
  }
}
