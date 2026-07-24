import { z } from "zod"

import {
  lessonStepBaseSchema,
  stableStepItemIdSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const matchStepDtoSchema = lessonStepBaseSchema
  .extend({
    type: z.literal("MATCH"),
    title: z.string(),
    guide: z.string(),
    pairs: z
      .array(
        z.strictObject({
          left: z.string(),
          leftId: stableStepItemIdSchema,
          right: z.string(),
          rightId: stableStepItemIdSchema,
        })
      )
      .min(1),
    explanation: z.string(),
  })
  .superRefine((step, context) => {
    const leftIds = step.pairs.map((pair) => pair.leftId)
    const rightIds = step.pairs.map((pair) => pair.rightId)
    if (
      new Set(leftIds).size !== leftIds.length ||
      new Set(rightIds).size !== rightIds.length
    ) {
      context.addIssue({
        code: "custom",
        message: "양쪽 연결 항목 ID는 각각 중복될 수 없습니다.",
        path: ["pairs"],
      })
    }
  })
