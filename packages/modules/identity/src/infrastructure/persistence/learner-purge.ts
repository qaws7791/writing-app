import { inArray } from "drizzle-orm"
import type { LearnerDataPurgePort } from "@workspace/db/learner-data-purge"

import { learnerProfiles } from "#identity/infrastructure/persistence/schema"

/** 학습자 profile은 identity module만 지운다. */
export const identityLearnerDataPurge: LearnerDataPurgePort = {
  moduleName: "identity",
  purge(transaction, userIds) {
    if (userIds.length === 0) return

    transaction
      .delete(learnerProfiles)
      .where(inArray(learnerProfiles.userId, userIds))
      .run()
  },
}
