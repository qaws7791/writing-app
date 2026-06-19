import {
  courseDetailDtoSchema,
  courseIdSchema,
  courseListDtoSchema,
} from "@workspace/contracts/content"
import { z } from "@workspace/hono/zod"

export const courseParamsSchema = z.object({
  courseId: courseIdSchema,
})

export { courseDetailDtoSchema, courseListDtoSchema }
