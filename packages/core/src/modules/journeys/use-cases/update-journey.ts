import { err, ok, ResultAsync } from "neverthrow"

import type { JourneyId } from "../../../shared/brand/index"
import type { JourneySummary, UpdateJourneyInput } from "../journey-types"
import type { JourneyRepository } from "../journey-port"
import { journeyNotFound, type JourneyNotFoundError } from "../journey-error"

export type UpdateJourneyDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeUpdateJourneyUseCase(deps: UpdateJourneyDeps) {
  return (
    journeyId: JourneyId,
    input: UpdateJourneyInput
  ): ResultAsync<JourneySummary, JourneyNotFoundError> =>
    ResultAsync.fromSafePromise(
      deps.journeyRepository.update(journeyId, input)
    ).andThen((updated) =>
      updated !== null
        ? ok(updated)
        : err(journeyNotFound("여정을 찾을 수 없습니다.", journeyId))
    )
}
