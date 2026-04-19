import { err, ok, ResultAsync } from "neverthrow"

import type { StepId } from "../../../shared/brand/index"
import type { StepSummary, UpdateStepInput } from "../journey-types"
import type { JourneyRepository } from "../journey-port"
import { stepNotFound, type StepNotFoundError } from "../journey-error"

export type UpdateStepDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeUpdateStepUseCase(deps: UpdateStepDeps) {
  return (
    stepId: StepId,
    input: UpdateStepInput
  ): ResultAsync<StepSummary, StepNotFoundError> =>
    ResultAsync.fromSafePromise(
      deps.journeyRepository.updateStep(stepId, input)
    ).andThen((updated) =>
      updated !== null
        ? ok(updated)
        : err(stepNotFound("스텝을 찾을 수 없습니다.", stepId))
    )
}
