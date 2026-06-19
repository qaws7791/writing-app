import { learnerAccountStatusSchema } from "@workspace/contracts/status"
import { z } from "@workspace/hono/zod"

export const learnerUserSchema = z.object({
  email: z.string(),
  id: z.string(),
  image: z.string().nullable(),
  joinedAt: z.string().datetime(),
  name: z.string(),
  status: learnerAccountStatusSchema,
})

export const savedResponseSchema = z.object({
  saved: z.boolean(),
})
