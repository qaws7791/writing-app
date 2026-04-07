import { ResultAsync } from "neverthrow"

import type { JourneyCategory, JourneySummary } from "../journey-types"
import type { JourneyRepository } from "../journey-port"

export type ListJourneysDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeListJourneysUseCase(deps: ListJourneysDeps) {
  return (filters?: {
    category?: JourneyCategory
  }): ResultAsync<JourneySummary[], never> =>
    ResultAsync.fromSafePromise(deps.journeyRepository.list(filters))
}
