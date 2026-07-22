export type AiRequestLimitCounter = Readonly<{
  count: number
  limit: number
  reason: "admin-day" | "admin-minute" | "ip-minute"
  resetAt: Date
}>

export type AiRequestLimitDecision =
  | Readonly<{ kind: "allowed" }>
  | Readonly<{
      kind: "rejected"
      reason: AiRequestLimitCounter["reason"]
      retryAfterSeconds: number
    }>

export function decideAiRequestLimit(input: {
  readonly counters: readonly AiRequestLimitCounter[]
  readonly now: Date
}): AiRequestLimitDecision {
  const exceeded = input.counters.find(
    (counter) => counter.count >= counter.limit
  )
  if (exceeded === undefined) return { kind: "allowed" }

  return {
    kind: "rejected",
    reason: exceeded.reason,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((exceeded.resetAt.getTime() - input.now.getTime()) / 1_000)
    ),
  }
}
