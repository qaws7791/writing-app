import { z } from "zod"
import { adminContentAssetUploadDtoSchema } from "#contracts/content/admin-assets"
import { courseVisualKeySchema } from "#contracts/content/course"
import {
  contentAssetIdSchema,
  courseIdSchema,
  curriculumVersionIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "#contracts/content/ids"
import {
  lessonStepDtoSchema,
  validateAiFeedbackTargets,
} from "#contracts/content/course"
import { contentStatusSchema } from "#contracts/content/status"
import {
  nonNegativeIntegerSchema,
  positiveIntegerSchema,
} from "#contracts/shared/integer"

export const adminCourseStepDtoSchema = z.strictObject({
  contentJson: z.string(),
  id: lessonStepIdSchema,
  sortOrder: positiveIntegerSchema,
  status: contentStatusSchema,
  type: z.string(),
})

export const adminCourseLessonDtoSchema = z.strictObject({
  category: z.string().nullable(),
  description: z.string().nullable(),
  estimatedMinutes: positiveIntegerSchema,
  id: lessonIdSchema,
  sortOrder: positiveIntegerSchema,
  status: contentStatusSchema,
  summary: z.array(z.string()),
  steps: z.array(adminCourseStepDtoSchema),
  title: z.string(),
})

export const adminCourseUnitDtoSchema = z.strictObject({
  id: unitIdSchema,
  lessons: z.array(adminCourseLessonDtoSchema),
  sortOrder: positiveIntegerSchema,
  status: contentStatusSchema,
  title: z.string(),
})

export const adminCourseDetailDtoSchema = z.strictObject({
  category: z.string(),
  curriculumVersionId: curriculumVersionIdSchema,
  description: z.string(),
  editVersion: nonNegativeIntegerSchema,
  id: courseIdSchema,
  revision: positiveIntegerSchema,
  status: contentStatusSchema,
  title: z.string(),
  units: z.array(adminCourseUnitDtoSchema),
})

export const adminCourseListItemDtoSchema = z.strictObject({
  category: z.string(),
  id: courseIdSchema,
  lessonCount: nonNegativeIntegerSchema,
  revision: nonNegativeIntegerSchema,
  status: contentStatusSchema,
  title: z.string(),
  unitCount: nonNegativeIntegerSchema,
  visualKey: courseVisualKeySchema,
})

export const adminCourseListDtoSchema = z.strictObject({
  items: z.array(adminCourseListItemDtoSchema),
  pagination: z.strictObject({
    page: positiveIntegerSchema,
    pageSize: positiveIntegerSchema,
    totalItems: nonNegativeIntegerSchema,
    totalPages: positiveIntegerSchema,
  }),
})

export const adminArchiveCourseResultSchema = z.strictObject({
  archived: z.literal(true),
})

const activeEditorStatusSchema = z.literal("active")
export const adminCourseEditorStepSchema = lessonStepDtoSchema.and(
  z.object({ status: activeEditorStatusSchema })
)
export const adminCourseEditorLessonSchema = z
  .strictObject({
    category: z.string().nullable(),
    description: z.string().nullable(),
    estimatedMinutes: positiveIntegerSchema,
    id: lessonIdSchema,
    sortOrder: positiveIntegerSchema,
    status: activeEditorStatusSchema,
    summary: z.array(z.string()),
    steps: z.array(adminCourseEditorStepSchema),
    title: z.string().min(1),
  })
  .superRefine((lesson, context) => {
    validateContiguousSortOrders(lesson.steps, context)
    validateAiFeedbackTargets(lesson.steps, context)
  })
export const adminCourseEditorUnitSchema = z
  .strictObject({
    id: unitIdSchema,
    lessons: z.array(adminCourseEditorLessonSchema),
    sortOrder: positiveIntegerSchema,
    status: activeEditorStatusSchema,
    title: z.string().min(1),
  })
  .superRefine((unit, context) => {
    validateContiguousSortOrders(unit.lessons, context)
  })
const adminCourseEditorWriteDocumentFields = {
  category: z.string(),
  coverAssetId: contentAssetIdSchema.nullable(),
  curriculumVersionId: curriculumVersionIdSchema,
  description: z.string(),
  editVersion: nonNegativeIntegerSchema,
  id: courseIdSchema,
  revision: positiveIntegerSchema,
  status: activeEditorStatusSchema,
  title: z.string().min(1),
  units: z.array(adminCourseEditorUnitSchema),
} as const

export const adminCourseEditorWriteDocumentSchema = z
  .strictObject(adminCourseEditorWriteDocumentFields)
  .superRefine(validateEditorDocument)

export const adminCourseEditorDocumentSchema = z
  .strictObject({
    assets: z.array(adminContentAssetUploadDtoSchema),
    ...adminCourseEditorWriteDocumentFields,
  })
  .superRefine(validateEditorDocument)

export const adminPublishCourseResultSchema = z.strictObject({
  curriculumVersionId: curriculumVersionIdSchema,
  publishedAt: z.iso.datetime(),
  revision: positiveIntegerSchema,
})

function validateContiguousSortOrders(
  items: readonly { readonly sortOrder: number }[],
  context: z.RefinementCtx
): void {
  items.forEach((item, index) => {
    if (item.sortOrder !== index + 1) {
      context.addIssue({
        code: "custom",
        message: "sortOrder는 1부터 연속되어야 합니다.",
      })
    }
  })
}

function validateEditorDocument(
  document: {
    readonly units: readonly {
      readonly id: string
      readonly lessons: readonly {
        readonly id: string
        readonly steps: readonly {
          readonly id: string
          readonly sortOrder: number
        }[]
        readonly sortOrder: number
      }[]
      readonly sortOrder: number
    }[]
  },
  context: z.RefinementCtx
): void {
  validateContiguousSortOrders(document.units, context)
  validateUniqueEditorIds(document, context)
}

function validateUniqueEditorIds(
  document: {
    readonly units: readonly {
      readonly id: string
      readonly lessons: readonly {
        readonly id: string
        readonly steps: readonly { readonly id: string }[]
      }[]
    }[]
  },
  context: z.RefinementCtx
): void {
  const ids = new Set<string>()
  const addId = (id: string) => {
    if (ids.has(id)) {
      context.addIssue({ code: "custom", message: "ID는 중복될 수 없습니다." })
    }
    ids.add(id)
  }

  for (const unit of document.units) {
    addId(unit.id)
    for (const lesson of unit.lessons) {
      addId(lesson.id)
      for (const step of lesson.steps) addId(step.id)
    }
  }
}

export type AdminArchiveCourseResultDto = z.infer<
  typeof adminArchiveCourseResultSchema
>
export type AdminCourseStepDto = z.infer<typeof adminCourseStepDtoSchema>
export type AdminCourseLessonDto = z.infer<typeof adminCourseLessonDtoSchema>
export type AdminCourseUnitDto = z.infer<typeof adminCourseUnitDtoSchema>
export type AdminCourseDetailDto = z.infer<typeof adminCourseDetailDtoSchema>
export type AdminCourseListItemDto = z.infer<
  typeof adminCourseListItemDtoSchema
>
export type AdminCourseListDto = z.infer<typeof adminCourseListDtoSchema>
export type AdminCourseEditorDocument = z.infer<
  typeof adminCourseEditorDocumentSchema
>
export type AdminCourseEditorWriteDocument = z.infer<
  typeof adminCourseEditorWriteDocumentSchema
>
export type AdminPublishCourseResult = z.infer<
  typeof adminPublishCourseResultSchema
>
