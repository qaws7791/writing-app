import { z } from "zod"

import {
  curriculumNodeStatusSchema,
  type CurriculumNodeStatus,
} from "../content/curriculum-node-status"

export const adminCurriculumNodeStatusSchema = curriculumNodeStatusSchema
export type AdminCurriculumNodeStatus = CurriculumNodeStatus

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

export const adminCurriculumLessonDtoSchema = adminLessonSummaryDtoSchema
export const adminCurriculumChapterDtoSchema = adminChapterSummaryDtoSchema

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

export const adminCourseDetailDtoSchema = adminCourseListItemDtoSchema

export const adminEditorStepTypeSchema = z.enum([
  "INTRO",
  "CONCEPT",
  "READING_PASSAGE",
  "EXAMPLE_REVEAL",
  "COMPARE",
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "WORD_SELECT",
  "REORDER",
  "MATCH",
  "CLASSIFY",
  "SHORT_WRITE",
  "LONG_WRITE",
  "AI_FEEDBACK",
  "REVISION",
  "CHECKLIST",
  "REFLECTION",
  "SUMMARY",
  "TRANSCRIBE",
  "COMPLETE",
])

export const adminEditorStepSummaryDtoSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  type: adminEditorStepTypeSchema,
  title: z.string().min(1),
  sortOrder: z.number().int().positive(),
  points: z.number().int().nonnegative(),
  required: z.boolean(),
  status: adminCurriculumNodeStatusSchema,
})

export const adminEditorStepDetailDtoSchema =
  adminEditorStepSummaryDtoSchema.extend({
    content: z.unknown(),
  })

export const adminEditorLessonDetailDtoSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  categoryId: z.string().min(1),
  unitNumber: z.number().int().positive(),
  nextLessonId: z.string().min(1).nullable(),
  steps: z.array(adminEditorStepDetailDtoSchema),
})

export const adminEditorCurriculumDetailDtoSchema = z.object({
  chapters: z.array(adminCurriculumChapterDtoSchema),
  steps: z.array(adminEditorStepDetailDtoSchema),
})

export const adminCourseEditorDocumentDtoSchema = z.object({
  course: adminCourseDetailDtoSchema,
  revision: z.number().int().nonnegative(),
  curriculum: adminEditorCurriculumDetailDtoSchema,
})

export const adminCourseEditorDetailDtoSchema =
  adminCourseEditorDocumentDtoSchema

export const adminSaveCurriculumContentRequestDtoSchema = z.object({
  courseId: z.string().min(1),
  expectedRevision: z.number().int().nonnegative(),
  course: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    sortOrder: z.number().int().positive(),
  }),
  chapters: z.array(adminCurriculumChapterDtoSchema.omit({ lessons: true })),
  lessons: z.array(
    adminCurriculumLessonDtoSchema.extend({
      chapterId: z.string().min(1),
    })
  ),
  steps: z.array(adminEditorStepDetailDtoSchema),
})

export const adminCourseEditorSaveRequestDtoSchema =
  adminSaveCurriculumContentRequestDtoSchema

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

export type AdminCourseDetailDto = z.infer<typeof adminCourseDetailDtoSchema>
export type AdminCourseEditorDetailDto = z.infer<
  typeof adminCourseEditorDetailDtoSchema
>
export type AdminCourseEditorDocumentDto = z.infer<
  typeof adminCourseEditorDocumentDtoSchema
>
export type AdminCourseEditorSaveRequestDto = z.infer<
  typeof adminCourseEditorSaveRequestDtoSchema
>
export type AdminCourseListDto = z.infer<typeof adminCourseListDtoSchema>
export type AdminCourseListInputDto = z.infer<
  typeof adminCourseListInputDtoSchema
>
export type AdminCourseTreeDto = z.infer<typeof adminCourseTreeDtoSchema>
export type AdminEditorStepType = z.infer<typeof adminEditorStepTypeSchema>
export type AdminEditorStepSummaryDto = z.infer<
  typeof adminEditorStepSummaryDtoSchema
>
export type AdminEditorStepDetailDto = z.infer<
  typeof adminEditorStepDetailDtoSchema
>
export type AdminEditorLessonDetailDto = z.infer<
  typeof adminEditorLessonDetailDtoSchema
>
export type AdminEditorCurriculumDetailDto = z.infer<
  typeof adminEditorCurriculumDetailDtoSchema
>
export type AdminSaveCurriculumContentRequestDto = z.infer<
  typeof adminSaveCurriculumContentRequestDtoSchema
>
export type AdminUserListDto = z.infer<typeof adminUserListDtoSchema>
