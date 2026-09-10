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
  purge(transaction, userIds) {
    if (userIds.length === 0) return

    const writingIds = chunkByBoundParameters(userIds, {
      fixedParameters: 0,
      parametersPerItem: 1,
    }).flatMap((userIdChunk) =>
      transaction
        .select({ id: writings.id })
        .from(writings)
        .where(inArray(writings.userId, userIdChunk))
        .all()
        .map((row) => row.id)
    )

    for (const writingIdChunk of chunkByBoundParameters(writingIds, {
      fixedParameters: 0,
      parametersPerItem: 1,
    })) {
      transaction
        .delete(writingChecks)
        .where(inArray(writingChecks.writingId, writingIdChunk))
        .run()
    }
    for (const userIdChunk of chunkByBoundParameters(userIds, {
      fixedParameters: 0,
      parametersPerItem: 1,
    })) {
      transaction
        .delete(writingAiNotices)
        .where(inArray(writingAiNotices.userId, userIdChunk))
        .run()
      transaction
        .delete(writingEvents)
        .where(inArray(writingEvents.userId, userIdChunk))
        .run()
      transaction
        .delete(writings)
        .where(inArray(writings.userId, userIdChunk))
        .run()
    }
  },
}
