import { z } from "zod"

import { authoringLimits } from "#contracts/content/authoring/authoring-limits"
import {
  categorizeItemTextSchema,
  categoryLabelSchema,
  explanationSchema,
  stepTitleSchema,
} from "#contracts/content/authoring/authoring-text-schemas"
import {
  lessonStepBaseSchema,
  stableStepItemIdSchema,
} from "#contracts/content/steps/lesson-step-fields"

export const categorizeStepDtoSchema = lessonStepBaseSchema
  .extend({
    type: z.literal("CATEGORIZE"),
    title: stepTitleSchema,
    categories: z
      .array(
        z.strictObject({
          id: stableStepItemIdSchema,
          label: categoryLabelSchema,
        })
      )
      .min(authoringLimits.categorizeCategoryCount.min)
      .max(authoringLimits.categorizeCategoryCount.max),
    items: z
      .array(
        z.strictObject({
          id: stableStepItemIdSchema,
          text: categorizeItemTextSchema,
          categoryId: stableStepItemIdSchema,
        })
      )
      .min(authoringLimits.categorizeItemCount.min)
      .max(authoringLimits.categorizeItemCount.max),
    explanation: explanationSchema,
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
