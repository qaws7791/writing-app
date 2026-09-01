import { z } from "zod"

import { authoringLimits } from "#contracts/content/authoring/authoring-limits"
import {
  explanationSchema,
  optionTextSchema,
  questionPromptSchema,
} from "#contracts/content/authoring/authoring-text-schemas"
import {
  lessonStepBaseSchema,
  stableStepItemIdSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const multipleChoiceStepDtoSchema = lessonStepBaseSchema
  .extend({
    type: z.literal("MULTIPLE_CHOICE"),
    question: questionPromptSchema,
    options: z
      .array(
        z.strictObject({
          id: stableStepItemIdSchema,
          text: optionTextSchema,
        })
      )
      .min(authoringLimits.multipleChoiceOptionCount.min)
      .max(authoringLimits.multipleChoiceOptionCount.max),
    correct: stableStepItemIdSchema,
    explanation: explanationSchema,
    wrong: z.string().optional(),
  })
  .superRefine((step, context) => {
    const optionIds = step.options.map((option) => option.id)
    if (new Set(optionIds).size !== optionIds.length) {
      context.addIssue({
        code: "custom",
        message: "선택지 ID는 중복될 수 없습니다.",
        path: ["options"],
      })
    }
    if (!optionIds.includes(step.correct)) {
      context.addIssue({
        code: "custom",
        message: "정답은 선택지 ID를 참조해야 합니다.",
        path: ["correct"],
      })
    }
  })
