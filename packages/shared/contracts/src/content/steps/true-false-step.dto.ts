import { z } from "zod"

import {
  explanationSchema,
  questionPromptSchema,
  statementSchema,
} from "#contracts/content/authoring/authoring-text-schemas"
import { lessonStepBaseSchema } from "#contracts/content/steps/lesson-step-fields"

export const trueFalseStepDtoSchema = lessonStepBaseSchema.extend({
  type: z.literal("TRUE_FALSE"),
  question: questionPromptSchema,
  statement: statementSchema,
  correct: z.boolean(),
  explanation: explanationSchema,
})
