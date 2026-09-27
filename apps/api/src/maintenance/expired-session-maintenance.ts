import { and, asc, inArray, lte } from "drizzle-orm"
import { adminAuthSessions, authSessions } from "@workspace/auth/schema"
import { chunkByBoundParameters } from "@workspace/db/bound-parameter-chunks"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { Failure } from "@workspace/kernel/failure"
import { err, ok, type Result } from "@workspace/kernel/result"

type ExpiredSessionMaintenanceResult = Readonly<{
  deletedSessions: number
  matchedSessions: number
}>

type ExpiredSessionMaintenanceError =
  Failure<"expired-session-maintenance-failed">

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
        const candidates = await readExpiredSessionCandidates(database, input)
        if (input.dryRun || candidates.length === 0) {
          return ok({
            deletedSessions: 0,
            matchedSessions: candidates.length,
          })
        }

        const learnerIds = candidates
          .filter((candidate) => candidate.type === "learner")
          .map(({ id }) => id)
        const adminIds = candidates
          .filter((candidate) => candidate.type === "admin")
          .map(({ id }) => id)
        const queries = [
          ...chunkByBoundParameters(learnerIds, {
            fixedParameters: 1,
            parametersPerItem: 1,
          }).map((ids) =>
            database
              .delete(authSessions)
              .where(
                and(
                  inArray(authSessions.id, ids),
                  lte(authSessions.expiresAt, input.cutoff)
                )
              )
              .returning({ id: authSessions.id })
          ),
          ...chunkByBoundParameters(adminIds, {
            fixedParameters: 1,
            parametersPerItem: 1,
          }).map((ids) =>
            database
              .delete(adminAuthSessions)
              .where(
                and(
                  inArray(adminAuthSessions.id, ids),
                  lte(adminAuthSessions.expiresAt, input.cutoff)
                )
              )
              .returning({ id: adminAuthSessions.id })
          ),
        ]
        const [first, ...rest] = queries
        const results =
          first === undefined ? [] : await database.batch([first, ...rest])
        const deletedSessions = results.reduce(
          (total, rows) => total + rows.length,
          0
        )

        return ok({
          deletedSessions,
          matchedSessions: candidates.length,
        })
      } catch (cause) {
        return err({ cause, kind: "expired-session-maintenance-failed" })
      }
    },
  }
}

async function readExpiredSessionCandidates(
  database: WritingAppDatabase,
  input: { readonly batchSize: number; readonly cutoff: Date }
): Promise<readonly SessionCandidate[]> {
  const learnerCandidates = (
    await database
      .select({
        expiresAt: authSessions.expiresAt,
        id: authSessions.id,
      })
      .from(authSessions)
      .where(lte(authSessions.expiresAt, input.cutoff))
      .orderBy(asc(authSessions.expiresAt), asc(authSessions.id))
      .limit(input.batchSize)
      .all()
  ).map((session) => ({ ...session, type: "learner" as const }))
  const adminCandidates = (
    await database
      .select({
        expiresAt: adminAuthSessions.expiresAt,
        id: adminAuthSessions.id,
      })
      .from(adminAuthSessions)
      .where(lte(adminAuthSessions.expiresAt, input.cutoff))
      .orderBy(asc(adminAuthSessions.expiresAt), asc(adminAuthSessions.id))
      .limit(input.batchSize)
      .all()
  ).map((session) => ({ ...session, type: "admin" as const }))

  return [...learnerCandidates, ...adminCandidates]
    .sort(
      (left, right) =>
        left.expiresAt.getTime() - right.expiresAt.getTime() ||
        left.id.localeCompare(right.id) ||
        left.type.localeCompare(right.type)
    )
    .slice(0, input.batchSize)
}
