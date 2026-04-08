import { ResultAsync } from "neverthrow"

import type { SessionId, UserId } from "../../../shared/brand/index"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { ProgressRepository } from "../progress-port"
import type { SessionRuntime } from "../progress-types"
import { buildSessionRuntime } from "./build-session-runtime"

export type GetSessionRuntimeDeps = {
  readonly journeyRepository: JourneyRepository
  readonly progressRepository: ProgressRepository
}

export function makeGetSessionRuntimeUseCase(deps: GetSessionRuntimeDeps) {
  return (
    userId: UserId,
    sessionId: SessionId
  ): ResultAsync<SessionRuntime, never> =>
    ResultAsync.fromSafePromise(
      buildSessionRuntime({
        journeyRepository: deps.journeyRepository,
        progressRepository: deps.progressRepository,
        sessionId,
        userId,
      })
    )
}
