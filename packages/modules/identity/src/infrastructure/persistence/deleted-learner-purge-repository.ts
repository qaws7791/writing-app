import { and, asc, eq, isNotNull, lte } from "drizzle-orm"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { LearnerDataPurgePort } from "@workspace/db/learner-data-purge"
import { err, ok } from "@workspace/kernel/result"

import type { DeletedLearnerPurgeRepository } from "#identity/application/identity-ports"
import { learnerProfiles } from "#identity/infrastructure/persistence/schema"

export function createDeletedLearnerPurgeRepository(input: {
  readonly database: WritingAppDatabase
  readonly learnerDataPurges: readonly LearnerDataPurgePort[]
}): DeletedLearnerPurgeRepository {
  return {
    async purgeDeletedBefore(command) {
      try {
        const result = input.database.transaction(
          (transaction) => {
            const userIds = transaction
              .select({ userId: learnerProfiles.userId })
              .from(learnerProfiles)
              .where(
                and(
                  eq(learnerProfiles.status, "deleted"),
                  isNotNull(learnerProfiles.deletedAt),
                  lte(learnerProfiles.deletedAt, command.cutoff)
                )
              )
              .orderBy(
                asc(learnerProfiles.deletedAt),
                asc(learnerProfiles.userId)
              )
              .limit(command.batchSize)
              .all()
              .map(({ userId }) => userIdSchema.parse(userId))

            if (command.dryRun || userIds.length === 0) {
              return {
                matchedUserCount: userIds.length,
                purgedUserCount: 0,
              }
            }

            for (const port of input.learnerDataPurges) {
              port.purge(transaction, userIds)
            }

            return {
              matchedUserCount: userIds.length,
              purgedUserCount: userIds.length,
            }
          },
          { behavior: "immediate" }
        )

        return ok(result)
      } catch (cause) {
        return err({ cause, kind: "deleted-learner-purge-failed" })
      }
    },
  }
}
