import { z } from "zod"

import { lessonTemplateIdSchema } from "@workspace/contracts/content/authoring"

const authoringWorkOrderSchema = z
  .strictObject({
    courseId: z.string().min(1).optional(),
    layout: z.array(z.string().min(1)).min(1).optional(),
    lessonId: z.string().min(1),
    lessonsDirectory: z.string().min(1).optional(),
    stepCount: z.number().int().positive().optional(),
    template: lessonTemplateIdSchema.optional(),
  })
  .superRefine((order, context) => {
    if (order.layout === undefined && order.template === undefined) {
      context.addIssue({
        code: "custom",
        message: "layout 또는 template 중 하나는 필요합니다.",
        path: ["layout"],
      })
    }
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
