import {
  completeLearnerStepParamsSchema,
  createLearnerAiFeedbackTransitionHeadersSchema,
  learnerAiFeedbackTransitionResponseSchema,
} from "@workspace/contracts/learning"

export const createFeedbackTransitionHeadersSchema =
  createLearnerAiFeedbackTransitionHeadersSchema
export const createFeedbackTransitionParamsSchema =
  completeLearnerStepParamsSchema
export const aiFeedbackTransitionResultSchema =
  learnerAiFeedbackTransitionResponseSchema
