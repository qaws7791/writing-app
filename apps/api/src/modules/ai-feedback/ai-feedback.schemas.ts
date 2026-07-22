import { completeLearnerStepParamsSchema } from "@workspace/contracts/learning/learner-transition"
import {
  createLearnerAiFeedbackTransitionHeadersSchema,
  learnerAiFeedbackTransitionResponseSchema,
} from "@workspace/contracts/learning/learner-api"

export const createFeedbackTransitionHeadersSchema =
  createLearnerAiFeedbackTransitionHeadersSchema
export const createFeedbackTransitionParamsSchema =
  completeLearnerStepParamsSchema
export const aiFeedbackTransitionResultSchema =
  learnerAiFeedbackTransitionResponseSchema
