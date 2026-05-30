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

export const adminLessonMigrationMappingTypeSchema = z.enum([
  "equivalent",
  "split",
  "merged",
  "removed",
])

export const adminCurriculumMigrationStatusSchema = z.enum([
  "active",
  "archived",
])

export const adminCurriculumMigrationMappingDtoSchema = z.object({
  id: z.string().min(1),
  fromLessonId: z.string().min(1),
  toLessonId: z.string().min(1).nullable(),
  mappingType: adminLessonMigrationMappingTypeSchema,
})

export const adminCreateCurriculumMigrationMappingDtoSchema = z.object({
  fromLessonId: z.string().min(1),
  toLessonId: z.string().min(1).nullable(),
  mappingType: adminLessonMigrationMappingTypeSchema,
})

export const adminCreateCurriculumMigrationRequestDtoSchema = z.object({
  fromVersionId: z.string().min(1),
  toVersionId: z.string().min(1),
  mappings: z.array(adminCreateCurriculumMigrationMappingDtoSchema).min(1),
})

export const adminCurriculumMigrationDetailDtoSchema = z.object({
  id: z.string().min(1),
  fromVersionId: z.string().min(1),
  toVersionId: z.string().min(1),
  status: adminCurriculumMigrationStatusSchema,
  createdAt: z.string().datetime(),
  mappings: z.array(adminCurriculumMigrationMappingDtoSchema),
})

export const adminApplyCurriculumMigrationRequestDtoSchema = z.object({
  migrationId: z.string().min(1),
  userId: z.string().min(1),
})

export const adminCurriculumMigrationApplicationStatusSchema = z.enum([
  "completed",
  "failed",
])

export const adminCurriculumMigrationApplicationDtoSchema = z.object({
  id: z.string().min(1),
  migrationId: z.string().min(1),
  userId: z.string().min(1),
  courseId: z.string().min(1),
  fromVersionId: z.string().min(1),
  toVersionId: z.string().min(1),
  status: adminCurriculumMigrationApplicationStatusSchema,
  completedLessonCount: z.number().int().nonnegative(),
  completedLessonIds: z.array(z.string().min(1)),
  preservedLessonIds: z.array(z.string().min(1)),
  skippedLessonIds: z.array(z.string().min(1)),
  errorMessage: z.string().min(1).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
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

export const adminEditorCurriculumVersionDetailDtoSchema =
  adminCurriculumVersionDetailDtoSchema.extend({
    revision: z.number().int().positive(),
    steps: z.array(adminEditorStepDetailDtoSchema),
  })

export const adminCourseEditorDocumentDtoSchema = z.object({
  course: adminCourseDetailDtoSchema,
  versions: z.array(adminCurriculumVersionSummaryDtoSchema),
  version: adminEditorCurriculumVersionDetailDtoSchema,
})

export const adminCourseEditorDetailDtoSchema =
  adminCourseEditorDocumentDtoSchema

export const adminRestoreCurriculumDraftRequestDtoSchema = z.object({
  sourceVersionId: z.string().min(1),
  replaceDraft: z.boolean(),
})

export const adminSaveCurriculumVersionContentRequestDtoSchema = z.object({
  courseId: z.string().min(1),
  versionId: z.string().min(1),
  baseRevision: z.number().int().positive(),
  course: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    sortOrder: z.number().int().positive(),
  }),
  chapters: z.array(
    adminCurriculumVersionChapterDtoSchema.omit({ lessons: true })
  ),
  lessons: z.array(
    adminCurriculumVersionLessonDtoSchema.extend({
      chapterId: z.string().min(1),
    })
  ),
  steps: z.array(adminEditorStepDetailDtoSchema),
})

export const adminCourseEditorSaveRequestDtoSchema =
  adminSaveCurriculumVersionContentRequestDtoSchema

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
export type AdminApplyCurriculumMigrationRequestDto = z.infer<
  typeof adminApplyCurriculumMigrationRequestDtoSchema
>
export type AdminCreateCurriculumMigrationRequestDto = z.infer<
  typeof adminCreateCurriculumMigrationRequestDtoSchema
>
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
export type AdminEditorCurriculumVersionDetailDto = z.infer<
  typeof adminEditorCurriculumVersionDetailDtoSchema
>
export type AdminRestoreCurriculumDraftRequestDto = z.infer<
  typeof adminRestoreCurriculumDraftRequestDtoSchema
>
export type AdminSaveCurriculumVersionContentRequestDto = z.infer<
  typeof adminSaveCurriculumVersionContentRequestDtoSchema
>
export type AdminCurriculumMigrationApplicationDto = z.infer<
  typeof adminCurriculumMigrationApplicationDtoSchema
>
export type AdminCurriculumMigrationDetailDto = z.infer<
  typeof adminCurriculumMigrationDetailDtoSchema
>
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
