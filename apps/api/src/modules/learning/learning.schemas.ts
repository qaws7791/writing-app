import {
  completeLearnerStepBodySchema,
  completeLearnerStepParamsSchema,
  learnerIdSchema,
  startLearnerLessonBodySchema,
} from "@workspace/contracts/learning"

export const startLessonBodySchema = startLearnerLessonBodySchema
export const completeStepBodySchema = completeLearnerStepBodySchema
export const completeStepParamsSchema = completeLearnerStepParamsSchema

export { learnerIdSchema }
