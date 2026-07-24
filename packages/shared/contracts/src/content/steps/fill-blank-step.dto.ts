import { z } from "zod"

import {
  lessonStepBaseSchema,
  stableStepItemIdSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const fillBlankStepDtoSchema = lessonStepBaseSchema
  .extend({
    type: z.literal("FILL_BLANK"),
    template: z.string(),
    words: z.array(z.string()).min(1),
    wordIds: z.array(stableStepItemIdSchema).min(1),
    answer: z.array(stableStepItemIdSchema).min(1),
    explanation: z.string(),
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
  })
