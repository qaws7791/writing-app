import { ResultAsync } from "neverthrow"

import type { DomainError } from "../../../shared/error/index"
import { createValidationError } from "../../../shared/error/index"
import type { SessionId, UserId } from "../../../shared/brand/index"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { ProgressRepository } from "../progress-port"
import type { SessionRuntime } from "../progress-types"
import { buildSessionRuntime } from "./build-session-runtime"

export type GetSessionRuntimeDeps = {
  readonly journeyRepository: JourneyRepository
  readonly progressRepository: ProgressRepository
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

  return createValidationError("세션을 불러오지 못했습니다.", "session")
}

export function makeGetSessionRuntimeUseCase(deps: GetSessionRuntimeDeps) {
  return (
    userId: UserId,
    sessionId: SessionId
  ): ResultAsync<SessionRuntime, DomainError> =>
    ResultAsync.fromPromise(
      buildSessionRuntime({
        journeyRepository: deps.journeyRepository,
        progressRepository: deps.progressRepository,
        sessionId,
        userId,
      }),
      normalizeError
    )
}
