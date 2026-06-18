import { learnerUserSchema } from "@/http/openapi"
import { z } from "@workspace/hono/zod"

export const sessionResponseSchema = z.object({
  user: learnerUserSchema,
})
