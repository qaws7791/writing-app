export type AiChatRequestGuard = {
  readonly acquire: (input: {
    readonly adminId: string
    readonly clientIp: string
    readonly conversationId: string | null
    readonly now: Date
  }) => AiChatRequestPermit
}

export type AiChatRequestPermit =
  | { readonly kind: "accepted"; readonly release: () => void }
  | {
      readonly kind: "rejected"
      readonly reason: "in-flight" | "rate-limit"
      readonly retryAfterSeconds: number
    }

const MINUTE_MS = 60_000
const DAY_MS = 86_400_000

export function createAiChatRequestGuard({
  dailyAdminLimit = 200,
  minuteAdminLimit = 20,
  minuteIpLimit = 40,
}: {
  readonly dailyAdminLimit?: number
  readonly minuteAdminLimit?: number
  readonly minuteIpLimit?: number
} = {}): AiChatRequestGuard {
  const counters = new Map<string, { count: number; resetAt: number }>()
  const inFlight = new Set<string>()

  return {
    acquire(input) {
      const now = input.now.getTime()
      const limits = [
        {
          key: `admin-minute:${input.adminId}`,
          limit: minuteAdminLimit,
          windowMs: MINUTE_MS,
        },
        {
          key: `ip-minute:${input.clientIp}`,
          limit: minuteIpLimit,
          windowMs: MINUTE_MS,
        },
        {
          key: `admin-day:${input.adminId}`,
          limit: dailyAdminLimit,
          windowMs: DAY_MS,
        },
      ] as const

      for (const limit of limits) {
        const counter = readCounter(counters, limit.key, now, limit.windowMs)
        if (counter.count >= limit.limit) {
          return {
            kind: "rejected",
            reason: "rate-limit",
            retryAfterSeconds: Math.max(
              1,
              Math.ceil((counter.resetAt - now) / 1_000)
            ),
          }
        }
      }

      const conversationKey = `${input.adminId}:${input.conversationId ?? "new"}`
      if (inFlight.has(conversationKey)) {
        return { kind: "rejected", reason: "in-flight", retryAfterSeconds: 1 }
      }

      for (const limit of limits) {
        readCounter(counters, limit.key, now, limit.windowMs).count += 1
      }
      inFlight.add(conversationKey)
      let released = false

      return {
        kind: "accepted",
        release() {
          if (!released) {
            released = true
            inFlight.delete(conversationKey)
          }
        },
      }
    },
  }
}

function readCounter(
  counters: Map<string, { count: number; resetAt: number }>,
  key: string,
  now: number,
  windowMs: number
) {
  const current = counters.get(key)
  if (current !== undefined && current.resetAt > now) {
    return current
  }
  const next = { count: 0, resetAt: now + windowMs }
  counters.set(key, next)
  return next
}
