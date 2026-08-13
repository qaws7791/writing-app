import { inArray } from "drizzle-orm"
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

    const writingIds = transaction
      .select({ id: writings.id })
      .from(writings)
      .where(inArray(writings.userId, userIds))
      .all()
      .map((row) => row.id)

    if (writingIds.length > 0) {
      transaction
        .delete(writingChecks)
        .where(inArray(writingChecks.writingId, writingIds))
        .run()
    }
    transaction
      .delete(writingAiNotices)
      .where(inArray(writingAiNotices.userId, userIds))
      .run()
    transaction
      .delete(writingEvents)
      .where(inArray(writingEvents.userId, userIds))
      .run()
    transaction.delete(writings).where(inArray(writings.userId, userIds)).run()
  },
}
