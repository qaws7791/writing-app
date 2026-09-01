import { z } from "zod"

import { authoringLimits } from "#contracts/content/authoring/authoring-limits"
import {
  explanationSchema,
  wordTextSchema,
} from "#contracts/content/authoring/authoring-text-schemas"
import {
  lessonStepBaseSchema,
  stableStepItemIdSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const fillBlankStepDtoSchema = lessonStepBaseSchema
  .extend({
    type: z.literal("FILL_BLANK"),
    template: z.string(),
    words: z
      .array(wordTextSchema)
      .min(authoringLimits.fillBlankWordPoolSize.min)
      .max(authoringLimits.fillBlankWordPoolSize.max),
    wordIds: z
      .array(stableStepItemIdSchema)
      .min(authoringLimits.fillBlankWordPoolSize.min)
      .max(authoringLimits.fillBlankWordPoolSize.max),
    answer: z
      .array(stableStepItemIdSchema)
      .min(authoringLimits.fillBlankBlankCount.min)
      .max(authoringLimits.fillBlankBlankCount.max),
    explanation: explanationSchema,
  })
  .superRefine((step, context) => {
    if (step.wordIds.length !== step.words.length) {
      context.addIssue({
        code: "custom",
        message: "단어와 단어 ID 개수는 같아야 합니다.",
        path: ["wordIds"],
      })
    }
    if (new Set(step.wordIds).size !== step.wordIds.length) {
      context.addIssue({
        code: "custom",
        message: "단어 ID는 중복될 수 없습니다.",
        path: ["wordIds"],
      })
    }
    if (
      new Set(step.answer).size !== step.answer.length ||
      step.answer.some((id) => !step.wordIds.includes(id))
    ) {
      context.addIssue({
        code: "custom",
        message: "정답은 중복 없는 단어 ID를 참조해야 합니다.",
        path: ["answer"],
      })
    }
    const blankCount = step.template.split("___").length - 1
    if (blankCount !== step.answer.length) {
      context.addIssue({
        code: "custom",
        message: "template의 빈칸 개수와 answer 개수는 같아야 합니다.",
        path: ["answer"],
      })
    }
  })
