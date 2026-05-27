import { z } from "zod"

export const adminCurriculumNodeStatusSchema = z.enum([
  "active",
  "deprecated",
  "archived",
])

export const adminCurriculumVersionStatusSchema = z.enum([
  "draft",
  "published",
  "archived",
])

export const adminCurriculumVersionSummaryDtoSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  versionNumber: z.number().int().positive(),
  status: adminCurriculumVersionStatusSchema,
  title: z.string().min(1),
  changelog: z.string().min(1),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
})

export const adminCurriculumVersionListDtoSchema = z.object({
  versions: z.array(adminCurriculumVersionSummaryDtoSchema),
})

export const adminLessonSummaryDtoSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.number().int().positive(),
  status: adminCurriculumNodeStatusSchema,
})

export const adminChapterSummaryDtoSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  sortOrder: z.number().int().positive(),
  status: adminCurriculumNodeStatusSchema,
  lessons: z.array(adminLessonSummaryDtoSchema),
})

export const adminCourseTreeItemDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.number().int().positive(),
  chapters: z.array(adminChapterSummaryDtoSchema),
})

export const adminCourseTreeDtoSchema = z.object({
  courses: z.array(adminCourseTreeItemDtoSchema),
})

export const adminCurriculumVersionLessonDtoSchema = adminLessonSummaryDtoSchema
export const adminCurriculumVersionChapterDtoSchema =
  adminChapterSummaryDtoSchema

export const adminCurriculumVersionDetailDtoSchema =
  adminCurriculumVersionSummaryDtoSchema.extend({
    chapters: z.array(adminCurriculumVersionChapterDtoSchema),
  })

export const adminCourseListPageSizeSchema = z.union([
  z.literal(10),
  z.literal(20),
  z.literal(30),
  z.literal(40),
  z.literal(50),
])

export const adminCourseListInputDtoSchema = z.object({
  page: z.number().int().positive(),
  pageSize: adminCourseListPageSizeSchema,
  query: z.string(),
})

export const adminCourseListItemDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  thumbnailPath: z.string().min(1),
  sortOrder: z.number().int().positive(),
})

export const adminCourseListDtoSchema = z.object({
  courses: z.array(adminCourseListItemDtoSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: adminCourseListPageSizeSchema,
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
  }),
  query: z.string(),
})

export const adminUserListItemDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const adminUserListDtoSchema = z.object({
  users: z.array(adminUserListItemDtoSchema),
})

export type AdminCourseListDto = z.infer<typeof adminCourseListDtoSchema>
export type AdminCourseListInputDto = z.infer<
  typeof adminCourseListInputDtoSchema
>
export type AdminCourseTreeDto = z.infer<typeof adminCourseTreeDtoSchema>
export type AdminCurriculumVersionDetailDto = z.infer<
  typeof adminCurriculumVersionDetailDtoSchema
>
export type AdminCurriculumVersionListDto = z.infer<
  typeof adminCurriculumVersionListDtoSchema
>
export type AdminCurriculumVersionSummaryDto = z.infer<
  typeof adminCurriculumVersionSummaryDtoSchema
>
export type AdminUserListDto = z.infer<typeof adminUserListDtoSchema>
