import { z } from "zod"

import {
  lessonStepBaseSchema,
  stableStepItemIdSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const orderStepDtoSchema = lessonStepBaseSchema
  .extend({
    type: z.literal("ORDER"),
    title: z.string(),
    items: z.array(z.string()).min(1),
    itemIds: z.array(stableStepItemIdSchema).min(1),
    correct: z.array(stableStepItemIdSchema).min(1),
    explanation: z.string(),
  })
  .superRefine((step, context) => {
    if (step.itemIds.length !== step.items.length) {
      context.addIssue({
        code: "custom",
        message: "항목과 항목 ID 개수는 같아야 합니다.",
        path: ["itemIds"],
      })
    }
    if (new Set(step.itemIds).size !== step.itemIds.length) {
      context.addIssue({
        code: "custom",
        message: "항목 ID는 중복될 수 없습니다.",
        path: ["itemIds"],
      })
    }
    if (
      step.correct.length !== step.itemIds.length ||
      new Set(step.correct).size !== step.correct.length ||
      step.correct.some((id) => !step.itemIds.includes(id))
    ) {
      context.addIssue({
        code: "custom",
        message: "정답은 모든 항목 ID를 한 번씩 포함해야 합니다.",
        path: ["correct"],
      })
    }
  })
