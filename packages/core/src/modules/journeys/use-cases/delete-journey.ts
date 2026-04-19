import { ResultAsync } from "neverthrow"

import type { JourneyId } from "../../../shared/brand/index"
import type { JourneyRepository } from "../journey-port"

export type DeleteJourneyDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeDeleteJourneyUseCase(deps: DeleteJourneyDeps) {
  return (journeyId: JourneyId): ResultAsync<void, never> =>
    ResultAsync.fromSafePromise(deps.journeyRepository.delete(journeyId))
}
