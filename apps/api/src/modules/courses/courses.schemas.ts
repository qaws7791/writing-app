import {
  courseDetailDtoSchema,
  courseIdSchema,
  courseListDtoSchema,
} from "@workspace/core/modules/content"
import { z } from "@workspace/hono/zod"

export const courseParamsSchema = z.object({
  courseId: courseIdSchema,
})

export { courseDetailDtoSchema, courseListDtoSchema }
