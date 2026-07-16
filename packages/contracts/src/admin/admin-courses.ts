import { z } from "zod"
import {
  adminContentStatusSchema,
  adminNonNegativeIntegerSchema,
  adminPositiveIntegerSchema,
} from "@workspace/contracts/admin/admin-shared"
import { courseVisualKeySchema } from "@workspace/contracts/content"
import {
  courseIdSchema,
  lessonIdSchema,
  lessonStepDtoSchema,
  unitIdSchema,
  validateAiFeedbackTargets,
} from "@workspace/contracts/content"

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
  curriculumVersionId: z.string(),
  description: z.string(),
  editVersion: adminNonNegativeIntegerSchema,
  id: z.string(),
  revision: adminPositiveIntegerSchema,
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

const activeEditorStatusSchema = z.literal("active")
export const adminCourseEditorStepSchema = lessonStepDtoSchema.and(
  z.object({ status: activeEditorStatusSchema })
)
export const adminCourseEditorLessonSchema = z
  .object({
    category: z.string().nullable(),
    description: z.string().nullable(),
    estimatedMinutes: adminPositiveIntegerSchema,
    id: lessonIdSchema,
    sortOrder: adminPositiveIntegerSchema,
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
  .object({
    id: unitIdSchema,
    lessons: z.array(adminCourseEditorLessonSchema),
    sortOrder: adminPositiveIntegerSchema,
    status: activeEditorStatusSchema,
    title: z.string().min(1),
  })
  .superRefine((unit, context) => {
    validateContiguousSortOrders(unit.lessons, context)
  })
export const adminCourseEditorDocumentSchema = z
  .object({
    category: z.string(),
    curriculumVersionId: z.string(),
    description: z.string(),
    editVersion: adminNonNegativeIntegerSchema,
    id: courseIdSchema,
    revision: adminPositiveIntegerSchema,
    status: activeEditorStatusSchema,
    title: z.string().min(1),
    units: z.array(adminCourseEditorUnitSchema),
  })
  .superRefine((document, context) => {
    validateContiguousSortOrders(document.units, context)
    validateUniqueEditorIds(document, context)
  })

export const adminPublishCourseResultSchema = z.object({
  curriculumVersionId: z.string(),
  publishedAt: z.iso.datetime(),
  revision: adminPositiveIntegerSchema,
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
export type AdminCourseDetailDto = z.infer<typeof adminCourseDetailDtoSchema>
export type AdminCourseListDto = z.infer<typeof adminCourseListDtoSchema>
export type AdminCourseEditorDocument = z.infer<
  typeof adminCourseEditorDocumentSchema
>
export type AdminPublishCourseResult = z.infer<
  typeof adminPublishCourseResultSchema
>
