import { eq } from "drizzle-orm"

import type { LearnerProfileRepository } from "#core/modules/auth/application/ports/learner-profile.repository"
import { learnerAccountStatuses } from "#core/shared/kernel/status"
import type { WritingAppDatabase } from "@workspace/db/client"
import { learnerProfiles } from "@workspace/db/schema"

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
