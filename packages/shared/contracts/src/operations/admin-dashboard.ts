import { z } from "zod"
import { nonNegativeIntegerSchema as adminNonNegativeIntegerSchema } from "#contracts/shared/integer"

const adminMetricPercentageSchema = z.number().min(0).max(100)
const adminMetricRateSchema = z.strictObject({
  denominator: adminNonNegativeIntegerSchema,
  numerator: adminNonNegativeIntegerSchema,
  percentage: adminMetricPercentageSchema.nullable(),
})

export const adminDashboardDtoSchema = z.strictObject({
  activeWindow: z.strictObject({
    from: z.iso.date(),
    to: z.iso.date(),
  }),
  asOfDate: z.iso.date(),
  metrics: z.strictObject({
    activeUsersLast7Days: adminNonNegativeIntegerSchema,
    activationRate: adminMetricRateSchema.extend({
      status: z.enum(["available", "empty"]),
    }),
    completedLessons: adminNonNegativeIntegerSchema,
    d7ReturnRate: adminMetricRateSchema.extend({
      matureCohortThrough: z.iso.date(),
      status: z.enum(["available", "empty", "immature"]),
    }),
    firstLessonStarts: adminNonNegativeIntegerSchema,
    totalUsers: adminNonNegativeIntegerSchema,
  }),
})

export type AdminDashboardDto = z.infer<typeof adminDashboardDtoSchema>
