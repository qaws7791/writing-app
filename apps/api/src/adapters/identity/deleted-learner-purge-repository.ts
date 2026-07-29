import { and, asc, eq, isNotNull, lte } from "drizzle-orm"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import type { WritingAppDatabase } from "@workspace/db/client"
import { learnerProfiles } from "@workspace/identity/schema"
import type { DeletedLearnerPurgeRepository } from "@workspace/identity/ports"
import { err, ok } from "@workspace/kernel/result"

import { deleteLearnerOwnedData } from "@/adapters/identity/learner-data-purge"

export function createDeletedLearnerPurgeRepository(
  database: WritingAppDatabase
): DeletedLearnerPurgeRepository {
  return {
    async purgeDeletedBefore(input) {
      try {
        const result = database.transaction(
          (transaction) => {
            const userIds = transaction
              .select({ userId: learnerProfiles.userId })
              .from(learnerProfiles)
              .where(
                and(
                  eq(learnerProfiles.status, "deleted"),
                  isNotNull(learnerProfiles.deletedAt),
                  lte(learnerProfiles.deletedAt, input.cutoff)
                )
              )
              .orderBy(
                asc(learnerProfiles.deletedAt),
                asc(learnerProfiles.userId)
              )
              .limit(input.batchSize)
              .all()
              .map(({ userId }) => userIdSchema.parse(userId))

            if (input.dryRun || userIds.length === 0) {
              return {
                matchedUserCount: userIds.length,
                purgedUserCount: 0,
              }
            }

            deleteLearnerOwnedData(transaction, userIds)

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
