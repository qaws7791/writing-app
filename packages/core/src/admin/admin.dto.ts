import { z } from "zod"

import {
  curriculumNodeStatusSchema,
  type CurriculumNodeStatus,
} from "../content/curriculum-node-status"
import { lessonStepContentSchemas } from "../content/content.dto"

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

function adminEditorStepDetailSchema<
  TType extends AdminEditorStepType,
  TContent extends z.ZodType,
>(type: TType, content: TContent) {
  return adminEditorStepSummaryDtoSchema.extend({
    type: z.literal(type),
    content,
  })
}

export const adminEditorStepDetailDtoSchema = z.discriminatedUnion("type", [
  adminEditorStepDetailSchema("INTRO", lessonStepContentSchemas.INTRO),
  adminEditorStepDetailSchema("CONCEPT", lessonStepContentSchemas.CONCEPT),
  adminEditorStepDetailSchema(
    "READING_PASSAGE",
    lessonStepContentSchemas.READING_PASSAGE
  ),
  adminEditorStepDetailSchema(
    "EXAMPLE_REVEAL",
    lessonStepContentSchemas.EXAMPLE_REVEAL
  ),
  adminEditorStepDetailSchema("COMPARE", lessonStepContentSchemas.COMPARE),
  adminEditorStepDetailSchema(
    "MULTIPLE_CHOICE",
    lessonStepContentSchemas.MULTIPLE_CHOICE
  ),
  adminEditorStepDetailSchema(
    "FILL_BLANK",
    lessonStepContentSchemas.FILL_BLANK
  ),
  adminEditorStepDetailSchema(
    "WORD_SELECT",
    lessonStepContentSchemas.WORD_SELECT
  ),
  adminEditorStepDetailSchema("REORDER", lessonStepContentSchemas.REORDER),
  adminEditorStepDetailSchema("MATCH", lessonStepContentSchemas.MATCH),
  adminEditorStepDetailSchema("CLASSIFY", lessonStepContentSchemas.CLASSIFY),
  adminEditorStepDetailSchema(
    "SHORT_WRITE",
    lessonStepContentSchemas.SHORT_WRITE
  ),
  adminEditorStepDetailSchema(
    "LONG_WRITE",
    lessonStepContentSchemas.LONG_WRITE
  ),
  adminEditorStepDetailSchema(
    "AI_FEEDBACK",
    lessonStepContentSchemas.AI_FEEDBACK
  ),
  adminEditorStepDetailSchema("REVISION", lessonStepContentSchemas.REVISION),
  adminEditorStepDetailSchema("CHECKLIST", lessonStepContentSchemas.CHECKLIST),
  adminEditorStepDetailSchema(
    "REFLECTION",
    lessonStepContentSchemas.REFLECTION
  ),
  adminEditorStepDetailSchema("SUMMARY", lessonStepContentSchemas.SUMMARY),
  adminEditorStepDetailSchema(
    "TRANSCRIBE",
    lessonStepContentSchemas.TRANSCRIBE
  ),
  adminEditorStepDetailSchema("COMPLETE", lessonStepContentSchemas.COMPLETE),
])

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

export const adminCourseEditorSaveRequestDtoSchema = z.object({
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

export const adminCurrentSessionDtoSchema = z.object({
  session: z.object({
    id: z.string().min(1),
  }),
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    image: z.string().nullable(),
  }),
})

export type AdminCurrentSessionDto = z.infer<
  typeof adminCurrentSessionDtoSchema
>
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
export type AdminUserListDto = z.infer<typeof adminUserListDtoSchema>
