import { z } from "zod"

import {
  lessonStepBaseSchema,
  stableStepItemIdSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const sentenceBuildStepDtoSchema = lessonStepBaseSchema
  .extend({
    type: z.literal("SENTENCE_BUILD"),
    question: z.string(),
    tiles: z.array(z.string()).min(1),
    tileIds: z.array(stableStepItemIdSchema).min(1),
    correct: z.array(stableStepItemIdSchema).min(1),
    explanation: z.string(),
  })
  .superRefine((step, context) => {
    if (step.tileIds.length !== step.tiles.length) {
      context.addIssue({
        code: "custom",
        message: "타일과 타일 ID 개수는 같아야 합니다.",
        path: ["tileIds"],
      })
    }
    if (new Set(step.tileIds).size !== step.tileIds.length) {
      context.addIssue({
        code: "custom",
        message: "타일 ID는 중복될 수 없습니다.",
        path: ["tileIds"],
      })
    }
    if (
      new Set(step.correct).size !== step.correct.length ||
      step.correct.some((id) => !step.tileIds.includes(id))
    ) {
      context.addIssue({
        code: "custom",
        message: "정답은 중복 없는 타일 ID를 참조해야 합니다.",
        path: ["correct"],
      })
    }
  })
