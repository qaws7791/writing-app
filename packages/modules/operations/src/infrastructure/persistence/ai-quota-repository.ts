import { eq } from "drizzle-orm"
import type { WritingAppDatabase } from "@workspace/db/client"

import type { AiQuotaRepository } from "#operations/application/ports/operations-ports"
import { decideAiRequestLimit } from "#operations/domain/ai-request-limit"
import { operationsAiQuotaCounters } from "#operations/infrastructure/persistence/schema"

const minuteMs = 60_000
const dayMs = 86_400_000

export function createAiQuotaRepository(
  database: WritingAppDatabase
): AiQuotaRepository {
  return Object.freeze({
    async consume(input) {
      return database.transaction((transaction) => {
        const counterDefinitions = [
          {
            key: `admin-minute:${input.adminId}`,
            limit: input.limits.minuteAdmin,
            reason: "admin-minute" as const,
            windowMs: minuteMs,
          },
          {
            key: `ip-minute:${input.clientIp}`,
            limit: input.limits.minuteIp,
            reason: "ip-minute" as const,
            windowMs: minuteMs,
          },
          {
            key: `admin-day:${input.adminId}`,
            limit: input.limits.dailyAdmin,
            reason: "admin-day" as const,
            windowMs: dayMs,
          },
        ]
        const counters = counterDefinitions.map((definition) => {
          const persisted = transaction
            .select()
            .from(operationsAiQuotaCounters)
            .where(eq(operationsAiQuotaCounters.key, definition.key))
            .get()
          const active =
            persisted !== undefined && persisted.resetAt > input.now
              ? persisted
              : {
                  count: 0,
                  key: definition.key,
                  resetAt: new Date(input.now.getTime() + definition.windowMs),
                }
          return { active, definition }
        })
        const decision = decideAiRequestLimit({
          counters: counters.map(({ active, definition }) => ({
            count: active.count,
            limit: definition.limit,
            reason: definition.reason,
            resetAt: active.resetAt,
          })),
          now: input.now,
        })
        if (decision.kind === "rejected") return decision

        for (const { active } of counters) {
          transaction
            .insert(operationsAiQuotaCounters)
            .values({ ...active, count: active.count + 1 })
            .onConflictDoUpdate({
              set: { count: active.count + 1, resetAt: active.resetAt },
              target: operationsAiQuotaCounters.key,
            })
            .run()
        }
        return { kind: "accepted" as const }
      })
    },
  })
}
