import {
  completeLearnerStepBodySchema,
  completeLearnerStepParamsSchema,
  startLearnerLessonBodySchema,
} from "@workspace/contracts/learning/learner-transition"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"

export const startLessonBodySchema = startLearnerLessonBodySchema
export const completeStepBodySchema = completeLearnerStepBodySchema
export const completeStepParamsSchema = completeLearnerStepParamsSchema

export { learnerIdSchema }
