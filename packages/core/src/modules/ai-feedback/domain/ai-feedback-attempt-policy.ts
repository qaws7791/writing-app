import { z } from "zod"

export const aiFeedbackAttemptPolicySchema = z
  .object({
    maxCompletedAttempts: z.number().int().positive(),
    pendingTtlMs: z.number().int().positive(),
    providerTimeoutMs: z.number().int().positive(),
  })
  .refine((policy) => policy.providerTimeoutMs < policy.pendingTtlMs, {
    message: "provider timeout은 pending 만료 시간보다 짧아야 합니다.",
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
  pendingTtlMs: 60_000,
  providerTimeoutMs: 30_000,
} as const satisfies AiFeedbackAttemptPolicy
