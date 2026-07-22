import { z } from "zod"
import { nonNegativeIntegerSchema } from "#contracts/shared/integer"

export const adminContentResetResultSchema = z.object({
  changed: z.object({
    archived: nonNegativeIntegerSchema,
    courses: nonNegativeIntegerSchema,
    lessons: nonNegativeIntegerSchema,
    steps: nonNegativeIntegerSchema,
    units: nonNegativeIntegerSchema,
  }),
  revision: nonNegativeIntegerSchema,
})

export type AdminContentResetResultDto = z.infer<
  typeof adminContentResetResultSchema
>
