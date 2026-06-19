import { z } from "zod"
import { adminNonNegativeIntegerSchema } from "@workspace/contracts/admin/admin-shared"

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
