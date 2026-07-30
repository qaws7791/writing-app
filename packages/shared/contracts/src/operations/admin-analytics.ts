import { z } from "zod"
import {
  nonNegativeIntegerSchema as adminNonNegativeIntegerSchema,
  positiveIntegerSchema as adminPositiveIntegerSchema,
} from "#contracts/shared/integer"
import { courseIdSchema, lessonIdSchema } from "#contracts/content/ids"

export const adminLessonAnalyticsItemDtoSchema = z.strictObject({
  completed: adminNonNegativeIntegerSchema,
  completionRate: adminNonNegativeIntegerSchema.max(100),
  courseId: courseIdSchema,
  courseTitle: z.string(),
  dropOffRate: adminNonNegativeIntegerSchema.max(100),
  lessonId: lessonIdSchema,
  lessonTitle: z.string(),
  started: adminNonNegativeIntegerSchema,
})

export const adminAiFeedbackLessonFailureDtoSchema = z.strictObject({
  courseId: courseIdSchema,
  courseTitle: z.string(),
  failureCount: adminPositiveIntegerSchema,
  failureRate: z.number().min(0).max(100),
  lessonId: lessonIdSchema,
  lessonTitle: z.string(),
  requestCount: adminPositiveIntegerSchema,
})

export const adminAnalyticsDtoSchema = z.strictObject({
  dailySeries: z.array(
    z.strictObject({
      completions: adminNonNegativeIntegerSchema,
      date: z.string(),
      returns: adminNonNegativeIntegerSchema.nullable(),
      returnStatus: z.enum(["available", "empty", "immature"]),
      signups: adminNonNegativeIntegerSchema,
      starts: adminNonNegativeIntegerSchema,
    })
  ),
  from: z.iso.date(),
  matureCohortThrough: z.iso.date(),
  to: z.iso.date(),
  worstAiFeedbackLessons: z.array(adminAiFeedbackLessonFailureDtoSchema),
  worstLessons: z.array(adminLessonAnalyticsItemDtoSchema),
})

export const adminLessonAnalyticsPageDtoSchema = z.strictObject({
  items: z.array(adminLessonAnalyticsItemDtoSchema),
  pagination: z.strictObject({
    page: adminPositiveIntegerSchema,
    pageSize: adminPositiveIntegerSchema,
    totalItems: adminNonNegativeIntegerSchema,
    totalPages: adminNonNegativeIntegerSchema,
  }),
})

export type AdminAnalyticsDto = z.infer<typeof adminAnalyticsDtoSchema>
export type AdminAiFeedbackLessonFailureDto = z.infer<
  typeof adminAiFeedbackLessonFailureDtoSchema
>
export type AdminLessonAnalyticsItemDto = z.infer<
  typeof adminLessonAnalyticsItemDtoSchema
>
export type AdminLessonAnalyticsPageDto = z.infer<
  typeof adminLessonAnalyticsPageDtoSchema
>
