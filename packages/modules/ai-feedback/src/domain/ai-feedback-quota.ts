import type { Brand } from "@workspace/types/brand"
import { platformDayBoundary } from "@workspace/kernel/day-boundary"
import { err, ok, type Result } from "@workspace/kernel/result"

export type AiFeedbackQuotaDate = Brand<string, "AiFeedbackQuotaDate">

export type AiFeedbackDailyQuotaPolicy = Readonly<{
  globalDailyRequestLimit: number
  globalDailySuccessLimit: number
  userDailyRequestLimit: number
  userDailySuccessLimit: number
}>

/** Exported default shared by callers; runtime mutation would alter cost safeguards globally. */
export const defaultAiFeedbackDailyQuotaPolicy = Object.freeze({
  globalDailyRequestLimit: 1_000,
  globalDailySuccessLimit: 500,
  userDailyRequestLimit: 20,
  userDailySuccessLimit: 10,
}) satisfies AiFeedbackDailyQuotaPolicy

export type AiFeedbackQuotaWindow = Readonly<{
  date: AiFeedbackQuotaDate
  retryAfterSeconds: number
}>

export function validateAiFeedbackDailyQuotaPolicy(
  policy: AiFeedbackDailyQuotaPolicy
): Result<
  AiFeedbackDailyQuotaPolicy,
  Readonly<{ kind: "daily-quota-policy-invalid" }>
> {
  if (
    !isPositiveInteger(policy.globalDailyRequestLimit) ||
    !isPositiveInteger(policy.globalDailySuccessLimit) ||
    !isPositiveInteger(policy.userDailyRequestLimit) ||
    !isPositiveInteger(policy.userDailySuccessLimit) ||
    policy.globalDailySuccessLimit > policy.globalDailyRequestLimit ||
    policy.userDailySuccessLimit > policy.userDailyRequestLimit
  ) {
    return err({ kind: "daily-quota-policy-invalid" })
  }

  return ok({ ...policy })
}

export function createAsiaSeoulQuotaWindow(now: Date): AiFeedbackQuotaWindow {
  const time = now.getTime()
  if (!Number.isFinite(time))
    throw new Error("AI feedback quota time is invalid")

  const { offsetMs } = platformDayBoundary
  const seoulTime = new Date(time + offsetMs)
  const nextSeoulMidnight =
    Date.UTC(
      seoulTime.getUTCFullYear(),
      seoulTime.getUTCMonth(),
      seoulTime.getUTCDate() + 1
    ) - offsetMs

  return {
    date: seoulTime.toISOString().slice(0, 10) as AiFeedbackQuotaDate,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((nextSeoulMidnight - time) / 1_000)
    ),
  }
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0
}
