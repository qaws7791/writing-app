import {
  createLearnerApiCore,
  type CreateLearnerApiCoreInput,
  type LearnerApiCore,
} from "@workspace/core/composition/bootstrap"
import {
  createLocalEventBus,
  type EventBus,
} from "@workspace/core/shared/event-bus"

export type CoreContainer = {
  readonly eventBus: EventBus
  readonly learnerApi: LearnerApiCore
}

export function createCoreContainer(
  input: CreateLearnerApiCoreInput
): CoreContainer {
  return {
    eventBus: createLocalEventBus(),
    learnerApi: createLearnerApiCore(input),
  }
}
