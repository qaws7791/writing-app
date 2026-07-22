import type { AdminId, ConversationId } from "@workspace/types/ids"

import type { AiQuotaRepository } from "#operations/application/ports/operations-ports"

export type AiRequestPermit =
  | Readonly<{ kind: "accepted"; release: () => void }>
  | Readonly<{
      kind: "rejected"
      reason: "admin-day" | "admin-minute" | "in-flight" | "ip-minute"
      retryAfterSeconds: number
    }>

export type AiRequestGuard = Readonly<{
  acquire: (
    input: Readonly<{
      adminId: AdminId
      clientIp: string
      conversationId: ConversationId | null
      now: Date
    }>
  ) => Promise<AiRequestPermit>
}>

export function createAiRequestGuard(input: {
  readonly dailyAdminLimit?: number
  readonly minuteAdminLimit?: number
  readonly minuteIpLimit?: number
  readonly repository: AiQuotaRepository
}): AiRequestGuard {
  const inFlight = new Set<string>()
  const limits = Object.freeze({
    dailyAdmin: input.dailyAdminLimit ?? 200,
    minuteAdmin: input.minuteAdminLimit ?? 20,
    minuteIp: input.minuteIpLimit ?? 40,
  })

  return Object.freeze({
    async acquire(command) {
      const key = `${command.adminId}:${command.conversationId ?? "new"}`
      if (inFlight.has(key)) {
        return {
          kind: "rejected",
          reason: "in-flight",
          retryAfterSeconds: 1,
        }
      }
      inFlight.add(key)
      let quota: Awaited<ReturnType<AiQuotaRepository["consume"]>>
      try {
        quota = await input.repository.consume({
          adminId: command.adminId,
          clientIp: command.clientIp,
          limits,
          now: command.now,
        })
      } catch (error) {
        inFlight.delete(key)
        throw error
      }
      if (quota.kind === "rejected") {
        inFlight.delete(key)
        return quota
      }

      let released = false
      return {
        kind: "accepted",
        release() {
          if (released) return
          released = true
          inFlight.delete(key)
        },
      }
    },
  })
}
