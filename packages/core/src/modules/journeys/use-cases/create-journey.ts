import { ResultAsync } from "neverthrow"

import type { CreateJourneyInput, JourneySummary } from "../journey-types"
import type { JourneyRepository } from "../journey-port"

export type CreateJourneyDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeCreateJourneyUseCase(deps: CreateJourneyDeps) {
  return (input: CreateJourneyInput): ResultAsync<JourneySummary, never> =>
    ResultAsync.fromSafePromise(deps.journeyRepository.create(input))
}
