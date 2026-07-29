import { inArray } from "drizzle-orm"
import type { LearnerDataPurgePort } from "@workspace/db/learner-data-purge"

import {
  aiFeedbackAttempts,
  aiFeedbackUserDailyCounters,
} from "#ai-feedback/infrastructure/persistence/schema"

/** AI 피드백 시도와 사용자 일일 counter는 ai-feedback module만 지운다. */
export const aiFeedbackLearnerDataPurge: LearnerDataPurgePort = {
  moduleName: "ai-feedback",
  purge(transaction, userIds) {
    if (userIds.length === 0) return

    transaction
      .delete(aiFeedbackAttempts)
      .where(inArray(aiFeedbackAttempts.userId, userIds))
      .run()
    transaction
      .delete(aiFeedbackUserDailyCounters)
      .where(inArray(aiFeedbackUserDailyCounters.userId, userIds))
      .run()
  },
}
