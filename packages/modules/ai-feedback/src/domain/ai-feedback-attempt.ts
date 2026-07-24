import type { Brand } from "@workspace/types/brand"
import { err, ok, type Result } from "@workspace/kernel/result"

export type AiFeedbackAttemptId = Brand<string, "AiFeedbackAttemptId">

export type AiFeedbackAttemptStatus =
  | "expired"
  | "failed"
  | "pending"
  | "succeeded"

export const aiFeedbackFailureCodeValues = [
  "pending-expired",
  "persistence-failed",
  "provider-response-invalid",
  "provider-timeout",
  "provider-unavailable",
  "request-aborted",
] as const

export type AiFeedbackFailureCode = (typeof aiFeedbackFailureCodeValues)[number]

export type AiFeedbackAttemptPolicy = Readonly<{
  maxCompletedAttempts: number
  pendingTtlMs: number
  providerTimeoutMs: number
}>

/** Exported default shared by callers; runtime mutation would alter timeout and attempt safeguards globally. */
export const defaultAiFeedbackAttemptPolicy = Object.freeze({
  maxCompletedAttempts: 3,
  pendingTtlMs: 60_000,
  providerTimeoutMs: 30_000,
}) satisfies AiFeedbackAttemptPolicy

export function createAiFeedbackAttemptId(value: string): AiFeedbackAttemptId {
  if (value.length === 0) throw new Error("AI feedback attempt ID is empty")
  return value as AiFeedbackAttemptId
}

export function validateAiFeedbackAttemptPolicy(
  policy: AiFeedbackAttemptPolicy
): Result<
  AiFeedbackAttemptPolicy,
  Readonly<{ kind: "attempt-policy-invalid" }>
> {
  if (
    !Number.isInteger(policy.maxCompletedAttempts) ||
    policy.maxCompletedAttempts <= 0 ||
    !Number.isInteger(policy.pendingTtlMs) ||
    policy.pendingTtlMs <= 0 ||
    !Number.isInteger(policy.providerTimeoutMs) ||
    policy.providerTimeoutMs <= 0 ||
    policy.providerTimeoutMs >= policy.pendingTtlMs
  ) {
    return err({ kind: "attempt-policy-invalid" })
  }

  return ok({ ...policy })
}

export function calculateRemainingAiFeedbackAttempts(input: {
  readonly completedAttempts: number
  readonly policy: AiFeedbackAttemptPolicy
}): number {
  return Math.max(
    0,
    input.policy.maxCompletedAttempts - input.completedAttempts
  )
}

export function transitionAiFeedbackAttempt(
  from: AiFeedbackAttemptStatus,
  to: AiFeedbackAttemptStatus
): Result<
  AiFeedbackAttemptStatus,
  Readonly<{ kind: "invalid-attempt-transition" }>
> {
  return from === "pending" && to !== "pending"
    ? ok(to)
    : err({ kind: "invalid-attempt-transition" })
}
