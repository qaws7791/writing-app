import type { DatabaseStatement } from "@workspace/db/batch"
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
  statements(transaction, userIds) {
    const statements: DatabaseStatement[] = []
    if (userIds.length === 0) return statements

    for (const userIdChunk of chunkByBoundParameters(userIds, {
      fixedParameters: 0,
      parametersPerItem: 1,
    })) {
      statements.push(
        transaction
          .delete(learnerStepDrafts)
          .where(inArray(learnerStepDrafts.userId, userIdChunk))
      )
      statements.push(
        transaction
          .delete(learnerLessonAnswers)
          .where(inArray(learnerLessonAnswers.userId, userIdChunk))
      )
      statements.push(
        transaction
          .delete(learnerLessonProgress)
          .where(inArray(learnerLessonProgress.userId, userIdChunk))
      )
      statements.push(
        transaction
          .delete(learnerActivityDays)
          .where(inArray(learnerActivityDays.userId, userIdChunk))
      )
      statements.push(
        transaction
          .delete(learnerCourseProgress)
          .where(inArray(learnerCourseProgress.userId, userIdChunk))
      )
    }
    return statements
  },
}
