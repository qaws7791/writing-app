import { inArray } from "drizzle-orm"
import { chunkByBoundParameters } from "@workspace/db/bound-parameter-chunks"
import type { LearnerDataPurgePort } from "@workspace/db/learner-data-purge"

import {
  learnerActivityDays,
  learnerCourseProgress,
  learnerLessonAnswers,
  learnerLessonProgress,
  learnerStepDrafts,
} from "#learning/infrastructure/persistence/schema"

/** 학습 진행·답안·초안·활동일은 learning module만 지운다. */
export const learningLearnerDataPurge: LearnerDataPurgePort = {
  moduleName: "learning",
  purge(transaction, userIds) {
    if (userIds.length === 0) return

    for (const userIdChunk of chunkByBoundParameters(userIds, {
      fixedParameters: 0,
      parametersPerItem: 1,
    })) {
      transaction
        .delete(learnerStepDrafts)
        .where(inArray(learnerStepDrafts.userId, userIdChunk))
        .run()
      transaction
        .delete(learnerLessonAnswers)
        .where(inArray(learnerLessonAnswers.userId, userIdChunk))
        .run()
      transaction
        .delete(learnerLessonProgress)
        .where(inArray(learnerLessonProgress.userId, userIdChunk))
        .run()
      transaction
        .delete(learnerActivityDays)
        .where(inArray(learnerActivityDays.userId, userIdChunk))
        .run()
      transaction
        .delete(learnerCourseProgress)
        .where(inArray(learnerCourseProgress.userId, userIdChunk))
        .run()
    }
  },
}
