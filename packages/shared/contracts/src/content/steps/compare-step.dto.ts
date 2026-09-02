import { z } from "zod"

import {
  compareAnalysisSchema,
  compareVersionLabelSchema,
  compareVersionMarkSchema,
  compareVersionTextSchema,
  stepTitleSchema,
} from "#contracts/content/authoring/authoring-text-schemas"
import { lessonStepBaseSchema } from "#contracts/content/steps/lesson-step-fields"

const compareVersionSchema = z
  .strictObject({
    label: compareVersionLabelSchema,
    mark: compareVersionMarkSchema,
    text: compareVersionTextSchema,
  })
  .superRefine((version, context) => {
    if (countNonOverlappingOccurrences(version.text, version.mark) === 1) {
      return
    }

    context.addIssue({
      code: "custom",
      message: "강조 구간은 판본 본문에 한 번만 나타나야 합니다.",
      path: ["mark"],
    })
  })

export const compareStepDtoSchema = lessonStepBaseSchema.extend({
  analysis: compareAnalysisSchema,
  title: stepTitleSchema,
  type: z.literal("COMPARE"),
  versions: z.array(compareVersionSchema).min(2),
})

function countNonOverlappingOccurrences(text: string, mark: string): number {
  if (mark.length === 0) return 0

  let count = 0
  let from = 0
  while (from <= text.length - mark.length) {
    const index = text.indexOf(mark, from)
    if (index < 0) break
    count += 1
    from = index + mark.length
  }
  return count
}
