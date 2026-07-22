import { eq } from "drizzle-orm"

import type { LearnerTestAuthDisplayNameSynchronizer } from "@workspace/auth/learner/server"
import type { LearnerProfileRepository } from "@workspace/core/auth"
import { learnerAccountStatuses } from "@workspace/contracts/identity/status"
import type { WritingAppDatabase } from "@workspace/db/client"
import { authUsers, learnerProfiles } from "@workspace/db/schema"

export function createDrizzleLearnerProfileRepository(
  db: WritingAppDatabase
): LearnerProfileRepository {
  return {
    async ensureActiveProfile(input) {
      await Promise.resolve(
        db
          .insert(learnerProfiles)
          .values({
            deletedAt: null,
            displayName: input.displayName,
            status: learnerAccountStatuses.active,
            userId: input.userId,
          })
          .onConflictDoNothing()
          .run()
      )
    },
    async findProfileByUserId(userId) {
      const profile = await Promise.resolve(
        db
          .select({
            status: learnerProfiles.status,
          })
          .from(learnerProfiles)
          .where(eq(learnerProfiles.userId, userId))
          .get()
      )

      return profile ?? null
    },
  }
}

export function createDrizzleLearnerTestAuthDisplayNameSynchronizer(
  db: WritingAppDatabase
): LearnerTestAuthDisplayNameSynchronizer {
  return {
    async synchronizeDisplayName(input) {
      await Promise.resolve(
        db
          .update(authUsers)
          .set({
            name: input.displayName,
            updatedAt: input.updatedAt,
          })
          .where(eq(authUsers.id, input.userId))
          .run()
      )
      await Promise.resolve(
        db
          .update(learnerProfiles)
          .set({
            displayName: input.displayName,
          })
          .where(eq(learnerProfiles.userId, input.userId))
          .run()
      )
    },
  }
}
