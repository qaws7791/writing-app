import { inArray } from "drizzle-orm"
import type { LearnerDataPurgePort } from "@workspace/db/learner-data-purge"

import {
  writingEvents,
  writings,
} from "#writing/infrastructure/persistence/schema"

/** 글 원문과 원문 없는 쓰기 event는 writing module만 지웁니다. */
export const writingLearnerDataPurge: LearnerDataPurgePort = {
  moduleName: "writing",
  purge(transaction, userIds) {
    if (userIds.length === 0) return

    transaction
      .delete(writingEvents)
      .where(inArray(writingEvents.userId, userIds))
      .run()
    transaction.delete(writings).where(inArray(writings.userId, userIds)).run()
  },
}
