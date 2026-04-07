import { ResultAsync } from "neverthrow"

import type { UserId, SessionId } from "../../../shared/brand/index"
import type { UserSessionProgress } from "../progress-types"
import type { ProgressRepository } from "../progress-port"

export type StartSessionDeps = {
  readonly progressRepository: ProgressRepository
}

export function makeStartSessionUseCase(deps: StartSessionDeps) {
  return (
    userId: UserId,
    sessionId: SessionId
  ): ResultAsync<UserSessionProgress, never> =>
    ResultAsync.fromSafePromise(
      deps.progressRepository.startSession(userId, sessionId)
    )
}
