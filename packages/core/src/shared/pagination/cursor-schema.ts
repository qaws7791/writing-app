import { z, type ZodTypeAny } from "zod"

export const cursorPageQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export function cursorPageResponseSchema<T extends ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema).readonly(),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  })
}
