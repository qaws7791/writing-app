import { err, ok, ResultAsync } from "neverthrow"

import type { JourneyId } from "../../../shared/brand/index"
import type { JourneyDetail } from "../journey-types"
import type { JourneyRepository } from "../journey-port"
import { journeyNotFound, type JourneyModuleError } from "../journey-error"

export type GetJourneyDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeGetJourneyUseCase(deps: GetJourneyDeps) {
  return (
    journeyId: JourneyId
  ): ResultAsync<JourneyDetail, JourneyModuleError> =>
    ResultAsync.fromSafePromise(
      deps.journeyRepository.getById(journeyId)
    ).andThen((journey) =>
      journey !== null
        ? ok(journey)
        : err(journeyNotFound("여정을 찾을 수 없습니다.", journeyId))
    )
}
