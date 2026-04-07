import { ResultAsync } from "neverthrow"

import type { UserId, SessionId } from "../../../shared/brand/index"
import type { ProgressRepository } from "../progress-port"

export type SubmitStepDeps = {
  readonly progressRepository: ProgressRepository
}

export type SubmitStepInput = {
  readonly stepOrder: number
  readonly response: unknown
}

export function makeSubmitStepUseCase(deps: SubmitStepDeps) {
  return (
    userId: UserId,
    sessionId: SessionId,
    input: SubmitStepInput
  ): ResultAsync<void, never> =>
    ResultAsync.fromSafePromise(
      deps.progressRepository
        .getSessionProgress(userId, sessionId)
        .then(async (progress) => {
          const current = progress?.stepResponsesJson ?? {}
          const updated = {
            ...current,
            [String(input.stepOrder)]: input.response,
          }
          await deps.progressRepository.updateSessionProgress(
            userId,
            sessionId,
            {
              currentStepOrder: input.stepOrder + 1,
              stepResponsesJson: updated,
            }
          )
        })
    )
}
