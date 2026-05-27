import { z } from "zod"

export const adminLessonSummaryDtoSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.number().int().positive(),
})

export const adminChapterSummaryDtoSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  sortOrder: z.number().int().positive(),
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
export type AdminUserListDto = z.infer<typeof adminUserListDtoSchema>
