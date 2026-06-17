import { z } from "zod"

export const aiFeedbackAttemptPolicySchema = z.object({
  maxCompletedAttempts: z.number().int().positive(),
})

export type AiFeedbackAttemptPolicy = z.infer<
  typeof aiFeedbackAttemptPolicySchema
>

export const defaultAiFeedbackAttemptPolicy = {
  maxCompletedAttempts: 3,
} as const satisfies AiFeedbackAttemptPolicy
