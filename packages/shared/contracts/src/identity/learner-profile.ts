import { z } from "zod"

import { userIdSchema } from "#contracts/identity/admin-ids"
import { learnerAccountStatusSchema } from "#contracts/identity/status"
import { learnerProfileStatsDtoSchema } from "#contracts/learning/learner-read-model"

export const learnerUserSchema = z.strictObject({
  email: z.email(),
  id: userIdSchema,
  image: z.string().nullable(),
  joinedAt: z.string().datetime(),
  name: z.string(),
  status: learnerAccountStatusSchema,
})

export const learnerProfileResponseSchema = z.strictObject({
  stats: learnerProfileStatsDtoSchema,
  user: learnerUserSchema,
})

export const learnerSessionResponseSchema = z.strictObject({
  user: learnerUserSchema,
})

export type LearnerProfileResponse = z.infer<
  typeof learnerProfileResponseSchema
>
export type LearnerSessionResponse = z.infer<
  typeof learnerSessionResponseSchema
>
