import { ResultAsync } from "neverthrow"

import type { UserId, JourneyId, SessionId } from "../../../shared/brand/index"
import type { ProgressRepository } from "../progress-port"

export type CompleteSessionDeps = {
  readonly progressRepository: ProgressRepository
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
      input.nextSessionOrder / input.totalSessions
    )

    return ResultAsync.fromSafePromise(
      Promise.all([
        deps.progressRepository.updateSessionProgress(userId, input.sessionId, {
          status: "completed",
        }),
        deps.progressRepository.updateJourneyProgress(userId, input.journeyId, {
          currentSessionOrder: input.nextSessionOrder,
          completionRate,
          status:
            input.nextSessionOrder > input.totalSessions
              ? "completed"
              : "in_progress",
        }),
      ]).then(() => undefined)
    )
  }
}
