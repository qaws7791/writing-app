import type { DatabaseStatement } from "@workspace/db/batch"
import { inArray } from "drizzle-orm"
import { chunkByBoundParameters } from "@workspace/db/bound-parameter-chunks"
import type { LearnerDataPurgePort } from "@workspace/db/learner-data-purge"

import { learnerProfiles } from "#identity/infrastructure/persistence/schema"

/** 학습자 profile은 identity module만 지운다. */
export const identityLearnerDataPurge: LearnerDataPurgePort = {
  moduleName: "identity",
  statements(transaction, userIds) {
    const statements: DatabaseStatement[] = []
    if (userIds.length === 0) return statements

    for (const userIdChunk of chunkByBoundParameters(userIds, {
      fixedParameters: 0,
      parametersPerItem: 1,
    })) {
      statements.push(
        transaction
          .delete(learnerProfiles)
          .where(inArray(learnerProfiles.userId, userIdChunk))
      )
    }
    return statements
  },
}
