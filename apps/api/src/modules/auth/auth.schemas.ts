import { learnerUserSchema } from "@/http/learner-contract.schemas"
import { z } from "@workspace/hono/zod"

export const sessionResponseSchema = z.object({
  user: learnerUserSchema,
})
