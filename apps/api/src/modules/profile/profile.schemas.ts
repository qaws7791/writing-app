import { learnerProfileStatsDtoSchema } from "@workspace/contracts/learning"
import { learnerUserSchema } from "@/http/learner-contract.schemas"
import { z } from "@workspace/hono/zod"

export const profileResponseSchema = z.object({
  stats: learnerProfileStatsDtoSchema,
  user: learnerUserSchema,
})
