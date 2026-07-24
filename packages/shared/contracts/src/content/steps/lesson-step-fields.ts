import { z } from "zod"

import { lessonStepIdSchema } from "#contracts/content/ids"

export const positiveSortOrderSchema = z.number().int().positive()
export const nonNegativeIntegerSchema = z.number().int().nonnegative()
export const optionalTextSchema = z.string().optional()
export const stableStepItemIdSchema = z.string().min(1)
export const labeledTextSchema = z.strictObject({
  label: z.string(),
  text: z.string(),
})

export const lessonStepBaseSchema = z.strictObject({
  id: lessonStepIdSchema,
  sortOrder: positiveSortOrderSchema,
})
