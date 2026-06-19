import { learnerProfileStatsDtoSchema } from "@workspace/contracts/learning"
import { z } from "@workspace/hono/zod"

import { learnerUserSchema } from "@/http/openapi"

export const profileResponseSchema = z.object({
  stats: learnerProfileStatsDtoSchema,
  user: learnerUserSchema,
})
