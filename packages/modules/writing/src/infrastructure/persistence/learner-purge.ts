import type { DatabaseStatement } from "@workspace/db/batch"
import { inArray } from "drizzle-orm"
import { chunkByBoundParameters } from "@workspace/db/bound-parameter-chunks"
import type { LearnerDataPurgePort } from "@workspace/db/learner-data-purge"

import {
  writingAiNotices,
  writingChecks,
  writingEvents,
  writings,
} from "#writing/infrastructure/persistence/schema"

/** 글·점검·고지·event는 writing module만 지웁니다. 과제와 발행본은 남깁니다. */
export const writingLearnerDataPurge: LearnerDataPurgePort = {
  moduleName: "writing",
  statements(transaction, userIds) {
    const statements: DatabaseStatement[] = []
    if (userIds.length === 0) return statements

    for (const userIdChunk of chunkByBoundParameters(userIds, {
      fixedParameters: 0,
      parametersPerItem: 1,
    })) {
      statements.push(
        transaction
          .delete(writingChecks)
          .where(
            inArray(
              writingChecks.writingId,
              transaction
                .select({ id: writings.id })
                .from(writings)
                .where(inArray(writings.userId, userIdChunk))
            )
          )
      )
      statements.push(
        transaction
          .delete(writingAiNotices)
          .where(inArray(writingAiNotices.userId, userIdChunk))
      )
      statements.push(
        transaction
          .delete(writingEvents)
          .where(inArray(writingEvents.userId, userIdChunk))
      )
      statements.push(
        transaction
          .delete(writings)
          .where(inArray(writings.userId, userIdChunk))
      )
    }
    return statements
  },
}
