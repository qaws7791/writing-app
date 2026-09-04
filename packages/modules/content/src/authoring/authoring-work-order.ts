import { z } from "zod"

import { lessonTemplateIdSchema } from "@workspace/contracts/content/authoring"

const briefTextSchema = z.string().trim().min(1)

const contrastPairSchema = z.strictObject({
  awkward: briefTextSchema,
  correct: briefTextSchema,
})

/**
 * 레슨 브리프. 집필 에이전트는 이 브리프만 받고 형제 레슨 파일을 읽지 않는다.
 * 제품 문서: docs/product/authoring-guidelines.md
 */
const authoringWorkOrderSchema = z.strictObject({
  closing: briefTextSchema,
  contrastPairs: z.array(contrastPairSchema).min(6).max(8),
  courseId: z.string().min(1).optional(),
  distractorRules: z.strictObject({
    allowed: z.array(briefTextSchema).min(1),
    forbidden: z.array(briefTextSchema).min(1),
  }),
  forbidden: z.array(briefTextSchema),
  judgementAxis: briefTextSchema,
  lessonId: z.string().min(1),
  lessonsDirectory: z.string().min(1).optional(),
  scene: briefTextSchema,
  template: lessonTemplateIdSchema.optional(),
  thesis: briefTextSchema,
  title: briefTextSchema,
})

const authoringWorkOrderListSchema = z.array(authoringWorkOrderSchema)

const authoringWorkOrderManifestSchema = z.strictObject({
  courseId: z.string().min(1),
  lessonsDirectory: z.string().min(1),
  orders: authoringWorkOrderListSchema.min(1),
})

export type AuthoringWorkOrder = z.infer<typeof authoringWorkOrderSchema>

export function parseAuthoringWorkOrders(input: unknown): {
  readonly defaultCourseId?: string
  readonly defaultLessonsDirectory?: string
  readonly orders: readonly AuthoringWorkOrder[]
} {
  if (Array.isArray(input)) {
    return { orders: authoringWorkOrderListSchema.parse(input) }
  }

  const manifest = authoringWorkOrderManifestSchema.parse(input)
  return {
    defaultCourseId: manifest.courseId,
    defaultLessonsDirectory: manifest.lessonsDirectory,
    orders: manifest.orders,
  }
}
