import { and, asc, inArray, lte } from "drizzle-orm"
import { adminAuthSessions, authSessions } from "@workspace/auth/schema"
import type { WritingAppDatabase } from "@workspace/db/client"
import { err, ok, type Result } from "@workspace/kernel/result"

type ExpiredSessionMaintenanceResult = Readonly<{
  deletedSessions: number
  matchedSessions: number
}>

type ExpiredSessionMaintenanceError = Readonly<{
  kind: "expired-session-maintenance-failed"
}>

export type ExpiredSessionMaintenance = Readonly<{
  cleanup: (input: {
    readonly batchSize: number
    readonly cutoff: Date
    readonly dryRun: boolean
  }) => Promise<
    Result<ExpiredSessionMaintenanceResult, ExpiredSessionMaintenanceError>
  >
}>

type SessionCandidate = Readonly<{
  expiresAt: Date
  id: string
  type: "admin" | "learner"
}>

export function createExpiredSessionMaintenance(
  database: WritingAppDatabase
): ExpiredSessionMaintenance {
  return {
    async cleanup(input) {
      if (
        !Number.isFinite(input.cutoff.getTime()) ||
        !Number.isInteger(input.batchSize) ||
        input.batchSize < 1 ||
        input.batchSize > 1_000
      ) {
        return err({ kind: "expired-session-maintenance-failed" })
      }

      try {
        const candidates = readExpiredSessionCandidates(database, input)
        if (input.dryRun || candidates.length === 0) {
          return ok({
            deletedSessions: 0,
            matchedSessions: candidates.length,
          })
        }

        const deletedSessions = database.transaction(
          (transaction) => {
            const learnerIds = candidates.flatMap((candidate) =>
              candidate.type === "learner" ? [candidate.id] : []
            )
            const adminIds = candidates.flatMap((candidate) =>
              candidate.type === "admin" ? [candidate.id] : []
            )
            const deletedLearnerSessions =
              learnerIds.length === 0
                ? []
                : transaction
                    .delete(authSessions)
                    .where(
                      and(
                        inArray(authSessions.id, learnerIds),
                        lte(authSessions.expiresAt, input.cutoff)
                      )
                    )
                    .returning({ id: authSessions.id })
                    .all()
            const deletedAdminSessions =
              adminIds.length === 0
                ? []
                : transaction
                    .delete(adminAuthSessions)
                    .where(
                      and(
                        inArray(adminAuthSessions.id, adminIds),
                        lte(adminAuthSessions.expiresAt, input.cutoff)
                      )
                    )
                    .returning({ id: adminAuthSessions.id })
                    .all()
            return deletedLearnerSessions.length + deletedAdminSessions.length
          },
          { behavior: "immediate" }
        )

        return ok({
          deletedSessions,
          matchedSessions: candidates.length,
        })
      } catch {
        return err({ kind: "expired-session-maintenance-failed" })
      }
    },
  }
}

function readExpiredSessionCandidates(
  database: WritingAppDatabase,
  input: { readonly batchSize: number; readonly cutoff: Date }
): readonly SessionCandidate[] {
  const learnerCandidates = database
    .select({
      expiresAt: authSessions.expiresAt,
      id: authSessions.id,
    })
    .from(authSessions)
    .where(lte(authSessions.expiresAt, input.cutoff))
    .orderBy(asc(authSessions.expiresAt), asc(authSessions.id))
    .limit(input.batchSize)
    .all()
    .map((session) => ({ ...session, type: "learner" as const }))
  const adminCandidates = database
    .select({
      expiresAt: adminAuthSessions.expiresAt,
      id: adminAuthSessions.id,
    })
    .from(adminAuthSessions)
    .where(lte(adminAuthSessions.expiresAt, input.cutoff))
    .orderBy(asc(adminAuthSessions.expiresAt), asc(adminAuthSessions.id))
    .limit(input.batchSize)
    .all()
    .map((session) => ({ ...session, type: "admin" as const }))

  return [...learnerCandidates, ...adminCandidates]
    .sort(
      (left, right) =>
        left.expiresAt.getTime() - right.expiresAt.getTime() ||
        left.id.localeCompare(right.id) ||
        left.type.localeCompare(right.type)
    )
    .slice(0, input.batchSize)
}
