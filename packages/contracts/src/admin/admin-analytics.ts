import { z } from "zod"
import {
  adminNonNegativeIntegerSchema,
  adminPositiveIntegerSchema,
} from "@workspace/contracts/admin/admin-shared"

export const adminLessonAnalyticsItemDtoSchema = z.object({
  completed: adminNonNegativeIntegerSchema,
  completionRate: adminNonNegativeIntegerSchema.max(100),
  courseId: z.string(),
  courseTitle: z.string(),
  dropOffRate: adminNonNegativeIntegerSchema.max(100),
  lessonId: z.string(),
  lessonTitle: z.string(),
  started: adminNonNegativeIntegerSchema,
})

export const adminAnalyticsDtoSchema = z.object({
  dailySeries: z.array(
    z.object({
      completions: adminNonNegativeIntegerSchema,
      date: z.string(),
      signups: adminNonNegativeIntegerSchema,
    })
  ),
  streakBuckets: z.array(
    z.object({
      count: adminNonNegativeIntegerSchema,
      label: z.string(),
    })
  ),
  worstLessons: z.array(adminLessonAnalyticsItemDtoSchema),
})

export const adminLessonAnalyticsPageDtoSchema = z.object({
  items: z.array(adminLessonAnalyticsItemDtoSchema),
  pagination: z.object({
    page: adminPositiveIntegerSchema,
    pageSize: adminPositiveIntegerSchema,
    totalItems: adminNonNegativeIntegerSchema,
    totalPages: adminPositiveIntegerSchema,
  }),
})

export type AdminAnalyticsDto = z.infer<typeof adminAnalyticsDtoSchema>
export type AdminLessonAnalyticsPageDto = z.infer<
  typeof adminLessonAnalyticsPageDtoSchema
>
