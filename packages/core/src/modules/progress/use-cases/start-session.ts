import { ResultAsync } from "neverthrow"

import type { UserId, SessionId } from "../../../shared/brand/index"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { SessionRuntime } from "../progress-types"
import type { ProgressRepository } from "../progress-port"
import { buildSessionRuntime } from "./build-session-runtime"

export type StartSessionDeps = {
  readonly progressRepository: ProgressRepository
  readonly journeyRepository: JourneyRepository
}

export function makeStartSessionUseCase(deps: StartSessionDeps) {
  return (
    userId: UserId,
    sessionId: SessionId
  ): ResultAsync<SessionRuntime, never> =>
    ResultAsync.fromSafePromise(
      deps.progressRepository.startSession(userId, sessionId).then(() =>
        buildSessionRuntime({
          journeyRepository: deps.journeyRepository,
          progressRepository: deps.progressRepository,
          sessionId,
          userId,
        })
      )
    )
}
