import { ResultAsync } from "neverthrow"

import type { JourneyId } from "../../../shared/brand/index"
import type { JourneySessionSummary } from "../journey-types"
import type { JourneyRepository } from "../journey-port"

export type ListSessionsDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeListSessionsUseCase(deps: ListSessionsDeps) {
  return (journeyId: JourneyId): ResultAsync<JourneySessionSummary[], never> =>
    ResultAsync.fromSafePromise(deps.journeyRepository.listSessions(journeyId))
}
