import {
  lessonDtoSchema,
  lessonIdSchema,
} from "@workspace/core/modules/content"
import { z } from "@workspace/hono/zod"

export const lessonParamsSchema = z.object({
  lessonId: lessonIdSchema,
})

export { lessonDtoSchema }
