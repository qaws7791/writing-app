import { z } from "zod"
import { nonNegativeIntegerSchema as adminNonNegativeIntegerSchema } from "#contracts/shared/integer"

export const adminContentResetResultSchema = z.object({
  changed: z.object({
    archived: adminNonNegativeIntegerSchema,
    courses: adminNonNegativeIntegerSchema,
    lessons: adminNonNegativeIntegerSchema,
    steps: adminNonNegativeIntegerSchema,
    units: adminNonNegativeIntegerSchema,
  }),
  revision: adminNonNegativeIntegerSchema,
})

export type AdminContentResetResultDto = z.infer<
  typeof adminContentResetResultSchema
>
