import { ResultAsync } from "neverthrow"

import type { DomainError } from "../../../shared/error/index"
import { createValidationError } from "../../../shared/error/index"
import type { UserId, SessionId } from "../../../shared/brand/index"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { SessionRuntime } from "../progress-types"
import type { ProgressRepository } from "../progress-port"
import { buildSessionRuntime } from "./build-session-runtime"

export type StartSessionDeps = {
  readonly progressRepository: ProgressRepository
  readonly journeyRepository: JourneyRepository
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isDomainError(error: unknown): error is DomainError {
  return (
    isRecord(error) &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  )
}

function normalizeError(error: unknown): DomainError {
  if (isDomainError(error)) {
    return error
  }

  return createValidationError("세션을 시작하지 못했습니다.", "session")
}

export function makeStartSessionUseCase(deps: StartSessionDeps) {
  return (
    userId: UserId,
    sessionId: SessionId
  ): ResultAsync<SessionRuntime, DomainError> =>
    ResultAsync.fromPromise(
      deps.progressRepository.startSession(userId, sessionId).then(() =>
        buildSessionRuntime({
          journeyRepository: deps.journeyRepository,
          progressRepository: deps.progressRepository,
          sessionId,
          userId,
        })
      ),
      normalizeError
    )
}
