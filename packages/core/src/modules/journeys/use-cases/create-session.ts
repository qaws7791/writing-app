import { err, ok, ResultAsync } from "neverthrow"

import type { JourneyId } from "../../../shared/brand/index"
import {
  createConflictError,
  type ConflictError,
} from "../../../shared/error/index"
import type {
  CreateSessionInput,
  JourneySessionSummary,
} from "../journey-types"
import type { JourneyRepository } from "../journey-port"
import { journeyNotFound, type JourneyNotFoundError } from "../journey-error"

export type CreateSessionDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeCreateSessionUseCase(deps: CreateSessionDeps) {
  return (
    journeyId: JourneyId,
    input: CreateSessionInput
  ): ResultAsync<JourneySessionSummary, JourneyNotFoundError | ConflictError> =>
    ResultAsync.fromSafePromise(deps.journeyRepository.getById(journeyId))
      .andThen((journey) => {
        if (journey === null) {
          return err(journeyNotFound("여정을 찾을 수 없습니다.", journeyId))
        }
        const orderConflict = journey.sessions.some(
          (s) => s.order === input.order
        )
        if (orderConflict) {
          return err(
            createConflictError(
              `세션 순서 ${input.order}이(가) 이미 사용 중입니다.`,
              "session"
            )
          )
        }
        return ok(journey)
      })
      .andThen(() =>
        ResultAsync.fromSafePromise(
          deps.journeyRepository.createSession(journeyId, input)
        )
      )
}
