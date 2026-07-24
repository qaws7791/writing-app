import { and, asc, eq, inArray, lte, sql } from "drizzle-orm"

import type { WritingAppDatabase } from "@workspace/db/client"
import { err, ok } from "@workspace/kernel/result"

import type { AiFeedbackMaintenanceRepository } from "#ai-feedback/application/ai-feedback-maintenance"
import { aiFeedbackAttempts } from "#ai-feedback/infrastructure/persistence/schema"

type AiFeedbackMaintenanceTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

export function createDrizzleAiFeedbackMaintenanceRepository(
  database: WritingAppDatabase
): AiFeedbackMaintenanceRepository {
  return {
    async expireStalePending(input) {
      try {
        if (input.dryRun) {
          return ok({
            expiredAttempts: 0,
            matchedAttempts: readStalePendingIds(database, input).length,
          })
        }

        return ok(
          database.transaction(
            (transaction) => expireStalePending(transaction, input),
            { behavior: "immediate" }
          )
        )
      } catch (cause) {
        return err({ cause, kind: "ai-feedback-maintenance-failed" })
      }
    },
  }
}

function expireStalePending(
  transaction: AiFeedbackMaintenanceTransaction,
  input: Parameters<AiFeedbackMaintenanceRepository["expireStalePending"]>[0]
) {
  const candidateIds = readStalePendingIds(transaction, input)
  if (candidateIds.length === 0) {
    return { expiredAttempts: 0, matchedAttempts: 0 }
  }

  const expiredAttempts = transaction
    .update(aiFeedbackAttempts)
    .set({
      failureCode: "pending-expired",
      latencyMs: sql`${aiFeedbackAttempts.expiresAt} - ${aiFeedbackAttempts.createdAt}`,
      status: "expired",
      updatedAt: input.occurredAt,
    })
    .where(
      and(
        inArray(aiFeedbackAttempts.id, candidateIds),
        eq(aiFeedbackAttempts.status, "pending"),
        lte(aiFeedbackAttempts.expiresAt, input.occurredAt)
      )
    )
    .returning({ id: aiFeedbackAttempts.id })
    .all().length

  return {
    expiredAttempts,
    matchedAttempts: candidateIds.length,
  }
}

function readStalePendingIds(
  database: WritingAppDatabase | AiFeedbackMaintenanceTransaction,
  input: Parameters<AiFeedbackMaintenanceRepository["expireStalePending"]>[0]
): string[] {
  return database
    .select({ id: aiFeedbackAttempts.id })
    .from(aiFeedbackAttempts)
    .where(
      and(
        eq(aiFeedbackAttempts.status, "pending"),
        lte(aiFeedbackAttempts.expiresAt, input.occurredAt)
      )
    )
    .orderBy(asc(aiFeedbackAttempts.expiresAt), asc(aiFeedbackAttempts.id))
    .limit(input.batchSize)
    .all()
    .map(({ id }) => id)
}
