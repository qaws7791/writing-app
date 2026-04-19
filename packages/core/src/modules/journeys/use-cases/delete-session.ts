import { ResultAsync } from "neverthrow"

import type { SessionId } from "../../../shared/brand/index"
import type { JourneyRepository } from "../journey-port"

export type DeleteSessionDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeDeleteSessionUseCase(deps: DeleteSessionDeps) {
  return (sessionId: SessionId): ResultAsync<void, never> =>
    ResultAsync.fromSafePromise(deps.journeyRepository.deleteSession(sessionId))
}
