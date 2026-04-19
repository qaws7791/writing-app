import { ResultAsync } from "neverthrow"

import type { UserId, JourneyId } from "../../../shared/brand/index"
import type { RepositoryTransactionManager } from "../../../shared/transaction/index"
import type { UserJourneyProgress } from "../progress-types"
import type { ProgressRepository } from "../progress-port"

export type EnrollJourneyDeps = {
  readonly progressRepository: ProgressRepository
  readonly transactionManager: RepositoryTransactionManager
}

export function makeEnrollJourneyUseCase(deps: EnrollJourneyDeps) {
  return (
    userId: UserId,
    journeyId: JourneyId
  ): ResultAsync<UserJourneyProgress, never> =>
    ResultAsync.fromSafePromise(
      deps.transactionManager.run(async ({ progressRepository }) => {
        const progress = await progressRepository.enrollJourney(
          userId,
          journeyId
        )

        await progressRepository.initSessionProgressForJourney(
          userId,
          journeyId
        )

        return progress
      })
    )
}
