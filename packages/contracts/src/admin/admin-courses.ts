import { z } from "zod"
import {
  adminContentStatusSchema,
  adminNonNegativeIntegerSchema,
  adminPositiveIntegerSchema,
} from "@workspace/contracts/admin/admin-shared"
import { courseVisualKeySchema } from "@workspace/contracts/content"

export const adminCourseStepDtoSchema = z.object({
  contentJson: z.string(),
  id: z.string(),
  sortOrder: adminPositiveIntegerSchema,
  status: adminContentStatusSchema,
  type: z.string(),
})

export const adminCourseLessonDtoSchema = z.object({
  category: z.string().nullable(),
  description: z.string().nullable(),
  estimatedMinutes: adminPositiveIntegerSchema,
  id: z.string(),
  sortOrder: adminPositiveIntegerSchema,
  status: adminContentStatusSchema,
  summary: z.array(z.string()),
  steps: z.array(adminCourseStepDtoSchema),
  title: z.string(),
})

export const adminCourseUnitDtoSchema = z.object({
  id: z.string(),
  lessons: z.array(adminCourseLessonDtoSchema),
  sortOrder: adminPositiveIntegerSchema,
  status: adminContentStatusSchema,
  title: z.string(),
})

export const adminCourseDetailDtoSchema = z.object({
  category: z.string(),
  description: z.string(),
  id: z.string(),
  revision: adminNonNegativeIntegerSchema,
  status: adminContentStatusSchema,
  title: z.string(),
  units: z.array(adminCourseUnitDtoSchema),
})

export const adminCourseListItemDtoSchema = z.object({
  category: z.string(),
  id: z.string(),
  lessonCount: adminNonNegativeIntegerSchema,
  revision: adminNonNegativeIntegerSchema,
  status: adminContentStatusSchema,
  title: z.string(),
  unitCount: adminNonNegativeIntegerSchema,
  visualKey: courseVisualKeySchema,
})

export const adminCourseListDtoSchema = z.object({
  items: z.array(adminCourseListItemDtoSchema),
  pagination: z.object({
    page: adminPositiveIntegerSchema,
    pageSize: adminPositiveIntegerSchema,
    totalItems: adminNonNegativeIntegerSchema,
    totalPages: adminPositiveIntegerSchema,
  }),
})

export const adminArchiveCourseResultSchema = z.object({
  archived: z.literal(true),
})

export type AdminArchiveCourseResultDto = z.infer<
  typeof adminArchiveCourseResultSchema
>
export type AdminCourseDetailDto = z.infer<typeof adminCourseDetailDtoSchema>
export type AdminCourseListDto = z.infer<typeof adminCourseListDtoSchema>
