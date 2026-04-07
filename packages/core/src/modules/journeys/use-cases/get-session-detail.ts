import { err, ok, ResultAsync } from "neverthrow"

import type { SessionId } from "../../../shared/brand/index"
import type { JourneySessionDetail } from "../journey-types"
import type { JourneyRepository } from "../journey-port"
import { sessionNotFound, type JourneyModuleError } from "../journey-error"

export type GetSessionDetailDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeGetSessionDetailUseCase(deps: GetSessionDetailDeps) {
  return (
    sessionId: SessionId
  ): ResultAsync<JourneySessionDetail, JourneyModuleError> =>
    ResultAsync.fromSafePromise(
      deps.journeyRepository.getSessionDetail(sessionId)
    ).andThen((session) =>
      session !== null
        ? ok(session)
        : err(sessionNotFound("세션을 찾을 수 없습니다.", sessionId))
    )
}
