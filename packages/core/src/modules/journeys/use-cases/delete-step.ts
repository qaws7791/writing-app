import { ResultAsync } from "neverthrow"

import type { StepId } from "../../../shared/brand/index"
import type { JourneyRepository } from "../journey-port"

export type DeleteStepDeps = {
  readonly journeyRepository: JourneyRepository
}

export function makeDeleteStepUseCase(deps: DeleteStepDeps) {
  return (stepId: StepId): ResultAsync<void, never> =>
    ResultAsync.fromSafePromise(deps.journeyRepository.deleteStep(stepId))
}
