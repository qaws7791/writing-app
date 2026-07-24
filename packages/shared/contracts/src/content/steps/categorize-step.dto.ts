import { z } from "zod"

import {
  lessonStepBaseSchema,
  stableStepItemIdSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const categorizeStepDtoSchema = lessonStepBaseSchema
  .extend({
    type: z.literal("CATEGORIZE"),
    title: z.string(),
    guide: z.string(),
    categories: z
      .array(
        z.strictObject({
          id: stableStepItemIdSchema,
          label: z.string(),
        })
      )
      .min(1),
    items: z
      .array(
        z.strictObject({
          id: stableStepItemIdSchema,
          text: z.string(),
          categoryId: stableStepItemIdSchema,
        })
      )
      .min(1),
    explanation: z.string(),
  })
  .superRefine((step, context) => {
    const categoryIds = step.categories.map((category) => category.id)
    const itemIds = step.items.map((item) => item.id)
    if (new Set(categoryIds).size !== categoryIds.length) {
      context.addIssue({
        code: "custom",
        message: "카테고리 ID는 중복될 수 없습니다.",
        path: ["categories"],
      })
    }
    if (new Set(itemIds).size !== itemIds.length) {
      context.addIssue({
        code: "custom",
        message: "분류 항목 ID는 중복될 수 없습니다.",
        path: ["items"],
      })
    }
    if (step.items.some((item) => !categoryIds.includes(item.categoryId))) {
      context.addIssue({
        code: "custom",
        message: "분류 항목은 존재하는 카테고리 ID를 참조해야 합니다.",
        path: ["items"],
      })
    }
  })
