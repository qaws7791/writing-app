import { err, ok, ResultAsync } from "neverthrow"

import type { SessionId } from "../../../shared/brand/index"
import type {
  JourneySessionSummary,
  UpdateSessionInput,
} from "../journey-types"
import type { JourneyRepository } from "../journey-port"
import { sessionNotFound, type SessionNotFoundError } from "../journey-error"

export type UpdateSessionDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeUpdateSessionUseCase(deps: UpdateSessionDeps) {
  return (
    sessionId: SessionId,
    input: UpdateSessionInput
  ): ResultAsync<JourneySessionSummary, SessionNotFoundError> =>
    ResultAsync.fromSafePromise(
      deps.journeyRepository.updateSession(sessionId, input)
    ).andThen((updated) =>
      updated !== null
        ? ok(updated)
        : err(sessionNotFound("세션을 찾을 수 없습니다.", sessionId))
    )
}
