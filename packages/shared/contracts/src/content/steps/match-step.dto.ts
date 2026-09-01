import { z } from "zod"

import { authoringLimits } from "#contracts/content/authoring/authoring-limits"
import {
  explanationSchema,
  guideTextSchema,
  pairTextSchema,
  stepTitleSchema,
} from "#contracts/content/authoring/authoring-text-schemas"
import {
  lessonStepBaseSchema,
  stableStepItemIdSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const matchStepDtoSchema = lessonStepBaseSchema
  .extend({
    type: z.literal("MATCH"),
    title: stepTitleSchema,
    guide: guideTextSchema,
    pairs: z
      .array(
        z.strictObject({
          left: pairTextSchema,
          leftId: stableStepItemIdSchema,
          right: pairTextSchema,
          rightId: stableStepItemIdSchema,
        })
      )
      .min(authoringLimits.matchPairCount.min)
      .max(authoringLimits.matchPairCount.max),
    explanation: explanationSchema,
  })
  .superRefine((step, context) => {
    if (
      hasDuplicate(step.pairs.map((pair) => pair.leftId)) ||
      hasDuplicate(step.pairs.map((pair) => pair.rightId))
    ) {
      context.addIssue({
        code: "custom",
        message: "양쪽 연결 항목 ID는 각각 중복될 수 없습니다.",
        path: ["pairs"],
      })
    }
    if (
      hasDuplicate(step.pairs.map((pair) => pair.left)) ||
      hasDuplicate(step.pairs.map((pair) => pair.right))
    ) {
      context.addIssue({
        code: "custom",
        message:
          "양쪽 연결 항목 텍스트는 각각 중복될 수 없습니다. 학습자가 두 항목을 화면에서 구분할 수 없습니다.",
        path: ["pairs"],
      })
    }
  })

function hasDuplicate(values: readonly string[]): boolean {
  return new Set(values).size !== values.length
}
