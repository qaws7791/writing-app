import { z } from "zod"

export const aiFeedbackAttemptPolicySchema = z.object({
  maxCompletedAttempts: z.number().int().positive(),
})

export type AiFeedbackAttemptPolicy = z.infer<
  typeof aiFeedbackAttemptPolicySchema
>

export function calculateRemainingAiFeedbackAttempts({
  completedAttempts,
  attemptPolicy,
}: {
  readonly completedAttempts: number
  readonly attemptPolicy: AiFeedbackAttemptPolicy
}): number {
  const parsedAttemptPolicy = aiFeedbackAttemptPolicySchema.parse(attemptPolicy)

  return Math.max(
    0,
    parsedAttemptPolicy.maxCompletedAttempts - completedAttempts
  )
}

export const defaultAiFeedbackAttemptPolicy = {
  maxCompletedAttempts: 3,
} as const satisfies AiFeedbackAttemptPolicy
