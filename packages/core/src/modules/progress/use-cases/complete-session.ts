import { ResultAsync } from "neverthrow"

import type { UserId, JourneyId, SessionId } from "../../../shared/brand/index"
import type { RepositoryTransactionManager } from "../../../shared/transaction/index"
import type { ProgressRepository } from "../progress-port"

export type CompleteSessionDeps = {
  readonly progressRepository: ProgressRepository
  readonly transactionManager: RepositoryTransactionManager
}

export type CompleteSessionInput = {
  readonly sessionId: SessionId
  readonly journeyId: JourneyId
  readonly nextSessionOrder: number
  readonly totalSessions: number
}

export function makeCompleteSessionUseCase(deps: CompleteSessionDeps) {
  return (
    userId: UserId,
    input: CompleteSessionInput
  ): ResultAsync<void, never> => {
    const completionRate = Math.min(
      1,
      (input.nextSessionOrder - 1) / input.totalSessions
    )

    return ResultAsync.fromSafePromise(
      deps.transactionManager.run(async ({ progressRepository }) => {
        await Promise.all([
          progressRepository.updateSessionProgress(userId, input.sessionId, {
            status: "completed",
          }),
          progressRepository.updateJourneyProgress(userId, input.journeyId, {
            currentSessionOrder: input.nextSessionOrder,
            completionRate,
            status:
              input.nextSessionOrder > input.totalSessions
                ? "completed"
                : "in_progress",
          }),
        ])
      })
    )
  }
}
