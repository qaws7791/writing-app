import { err, ok, ResultAsync } from "neverthrow"

import type { JourneyId } from "../../../shared/brand/index"
import type { JourneyFullDetail } from "../journey-types"
import type { JourneyRepository } from "../journey-port"
import { journeyNotFound, type JourneyNotFoundError } from "../journey-error"

export type GetJourneyFullDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeGetJourneyFullUseCase(deps: GetJourneyFullDeps) {
  return (
    journeyId: JourneyId
  ): ResultAsync<JourneyFullDetail, JourneyNotFoundError> =>
    ResultAsync.fromSafePromise(
      deps.journeyRepository.getByIdFull(journeyId)
    ).andThen((journey) =>
      journey !== null
        ? ok(journey)
        : err(journeyNotFound("여정을 찾을 수 없습니다.", journeyId))
    )
}
