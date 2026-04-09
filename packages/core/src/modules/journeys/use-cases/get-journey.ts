import { err, ok, ResultAsync } from "neverthrow"

import type { JourneyId, UserId } from "../../../shared/brand/index"
import type { JourneyDetailWithProgress } from "../journey-types"
import type { JourneyRepository } from "../journey-port"
import type { ProgressRepository } from "../../progress/progress-port"
import { journeyNotFound, type JourneyModuleError } from "../journey-error"

export type GetJourneyDeps = {
  readonly journeyRepository: JourneyRepository
  readonly progressRepository: ProgressRepository
}

export function makeGetJourneyUseCase(deps: GetJourneyDeps) {
  return (
    journeyId: JourneyId,
    userId: UserId | null
  ): ResultAsync<JourneyDetailWithProgress, JourneyModuleError> =>
    ResultAsync.fromSafePromise(
      Promise.all([
        deps.journeyRepository.getById(journeyId),
        userId !== null
          ? deps.progressRepository.getJourneyProgress(userId, journeyId)
          : Promise.resolve(null),
      ])
    ).andThen(([journey, progress]) =>
      journey !== null
        ? ok({
            ...journey,
            progress: progress
              ? {
                  currentSessionOrder: progress.currentSessionOrder,
                  completionRate: progress.completionRate,
                  status: progress.status,
                }
              : null,
          })
        : err(journeyNotFound("여정을 찾을 수 없습니다.", journeyId))
    )
}
