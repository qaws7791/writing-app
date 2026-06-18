import { z } from "zod"

import { lessonStepIdSchema } from "@workspace/core/modules/content/domain/content.ids"

export const positiveSortOrderSchema = z.number().int().positive()
export const nonNegativeIntegerSchema = z.number().int().nonnegative()
export const optionalTextSchema = z.string().optional()
export const labeledTextSchema = z.object({
  label: z.string(),
  text: z.string(),
})

export const lessonStepBaseSchema = z.object({
  id: lessonStepIdSchema,
  sortOrder: positiveSortOrderSchema,
})
