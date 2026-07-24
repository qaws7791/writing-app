import { z } from "zod"

import { userIdSchema } from "#contracts/identity/admin-ids"
import { learnerAccountStatusSchema } from "#contracts/identity/status"
import { learnerProfileStatsDtoSchema } from "#contracts/learning/learner-read-model"

export const learnerDisplayNameSchema = z.string().trim().min(1).max(200)

export const learnerUserSchema = z.strictObject({
  email: z.email(),
  id: userIdSchema,
  image: z.string().nullable(),
  joinedAt: z.string().datetime(),
  name: learnerDisplayNameSchema,
  status: learnerAccountStatusSchema,
})

export const learnerProfileResponseSchema = z.strictObject({
  stats: learnerProfileStatsDtoSchema,
  user: learnerUserSchema,
})

export const learnerUpdateProfileRequestSchema = z.strictObject({
  name: learnerDisplayNameSchema,
})

export const learnerUpdateProfileResponseSchema = z.strictObject({
  name: learnerDisplayNameSchema,
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
export type LearnerUpdateProfileRequest = z.infer<
  typeof learnerUpdateProfileRequestSchema
>
export type LearnerUpdateProfileResponse = z.infer<
  typeof learnerUpdateProfileResponseSchema
>
