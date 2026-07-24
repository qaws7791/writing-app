import { z } from "zod"

import {
  lessonStepBaseSchema,
  optionalTextSchema,
  stableStepItemIdSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const selectStepDtoSchema = lessonStepBaseSchema
  .extend({
    type: z.literal("SELECT"),
    question: z.string(),
    segments: z.array(z.string()).min(1),
    segmentIds: z.array(stableStepItemIdSchema).min(1),
    correct: z.array(stableStepItemIdSchema).min(1),
    explanation: z.string(),
    layout: optionalTextSchema,
  })
  .superRefine((step, context) => {
    if (step.segmentIds.length !== step.segments.length) {
      context.addIssue({
        code: "custom",
        message: "구간과 구간 ID 개수는 같아야 합니다.",
        path: ["segmentIds"],
      })
    }
    if (new Set(step.segmentIds).size !== step.segmentIds.length) {
      context.addIssue({
        code: "custom",
        message: "구간 ID는 중복될 수 없습니다.",
        path: ["segmentIds"],
      })
    }
    if (
      new Set(step.correct).size !== step.correct.length ||
      step.correct.some((id) => !step.segmentIds.includes(id))
    ) {
      context.addIssue({
        code: "custom",
        message: "정답은 중복 없는 구간 ID를 참조해야 합니다.",
        path: ["correct"],
      })
    }
  })
