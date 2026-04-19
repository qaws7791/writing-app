import { err, ok, ResultAsync } from "neverthrow"

import type { SessionId } from "../../../shared/brand/index"
import {
  createConflictError,
  type ConflictError,
} from "../../../shared/error/index"
import type { CreateStepInput, StepSummary } from "../journey-types"
import type { JourneyRepository } from "../journey-port"
import { sessionNotFound, type SessionNotFoundError } from "../journey-error"

export type CreateStepDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeCreateStepUseCase(deps: CreateStepDeps) {
  return (
    sessionId: SessionId,
    input: CreateStepInput
  ): ResultAsync<StepSummary, SessionNotFoundError | ConflictError> =>
    ResultAsync.fromSafePromise(
      deps.journeyRepository.getSessionDetail(sessionId)
    )
      .andThen((detail) => {
        if (detail === null) {
          return err(sessionNotFound("세션을 찾을 수 없습니다.", sessionId))
        }
        const orderConflict = detail.steps.some((s) => s.order === input.order)
        if (orderConflict) {
          return err(
            createConflictError(
              `스텝 순서 ${input.order}이(가) 이미 사용 중입니다.`,
              "step"
            )
          )
        }
        return ok(detail)
      })
      .andThen(() =>
        ResultAsync.fromSafePromise(
          deps.journeyRepository.createStep(sessionId, input)
        )
      )
}
