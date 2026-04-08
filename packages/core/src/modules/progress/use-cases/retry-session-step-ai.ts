import { ResultAsync } from "neverthrow"

import type { DomainError } from "../../../shared/error/index"
import { createValidationError } from "../../../shared/error/index"
import type { SessionId, UserId } from "../../../shared/brand/index"
import type { JourneyRepository } from "../../journeys/journey-port"
import type { ProgressRepository } from "../progress-port"
import type { SessionRuntime } from "../progress-types"
import { buildSessionRuntime } from "./build-session-runtime"

export type RetrySessionStepAiDeps = {
  readonly journeyRepository: JourneyRepository
  readonly progressRepository: ProgressRepository
}

export type RetrySessionStepAiInput = {
  readonly stepOrder: number
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

  return createValidationError(
    "세션 AI 작업을 다시 시작하지 못했습니다.",
    "session"
  )
}

export function makeRetrySessionStepAiUseCase(deps: RetrySessionStepAiDeps) {
  return (
    userId: UserId,
    sessionId: SessionId,
    input: RetrySessionStepAiInput
  ): ResultAsync<SessionRuntime, DomainError> =>
    ResultAsync.fromPromise(
      (async () => {
        const currentState =
          await deps.progressRepository.getSessionStepAiState(
            userId,
            sessionId,
            input.stepOrder
          )

        if (currentState === null || currentState.status !== "failed") {
          throw createValidationError(
            "재시도 가능한 AI 상태를 찾을 수 없습니다.",
            "stepOrder"
          )
        }

        await deps.progressRepository.saveSessionStepAiState(
          userId,
          sessionId,
          input.stepOrder,
          {
            kind: currentState.kind,
            sourceStepOrder: currentState.sourceStepOrder,
            status: "pending",
            attemptCount: currentState.attemptCount,
            inputJson: currentState.inputJson,
            resultJson: null,
            errorMessage: null,
          }
        )

        return buildSessionRuntime({
          journeyRepository: deps.journeyRepository,
          progressRepository: deps.progressRepository,
          sessionId,
          userId,
        })
      })(),
      normalizeError
    )
}
