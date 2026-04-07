import { ResultAsync } from "neverthrow"

import type { UserId, JourneyId } from "../../../shared/brand/index"
import type { UserJourneyProgress } from "../progress-types"
import type { ProgressRepository } from "../progress-port"

export type EnrollJourneyDeps = {
  readonly progressRepository: ProgressRepository
}

export function makeEnrollJourneyUseCase(deps: EnrollJourneyDeps) {
  return (
    userId: UserId,
    journeyId: JourneyId
  ): ResultAsync<UserJourneyProgress, never> =>
    ResultAsync.fromSafePromise(
      deps.progressRepository
        .enrollJourney(userId, journeyId)
        .then(async (progress) => {
          await deps.progressRepository.initSessionProgressForJourney(
            userId,
            journeyId
          )
          return progress
        })
    )
}
