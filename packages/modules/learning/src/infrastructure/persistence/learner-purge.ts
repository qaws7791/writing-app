import { inArray } from "drizzle-orm"
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

    transaction
      .delete(learnerStepDrafts)
      .where(inArray(learnerStepDrafts.userId, userIds))
      .run()
    transaction
      .delete(learnerLessonAnswers)
      .where(inArray(learnerLessonAnswers.userId, userIds))
      .run()
    transaction
      .delete(learnerLessonProgress)
      .where(inArray(learnerLessonProgress.userId, userIds))
      .run()
    transaction
      .delete(learnerActivityDays)
      .where(inArray(learnerActivityDays.userId, userIds))
      .run()
    transaction
      .delete(learnerCourseProgress)
      .where(inArray(learnerCourseProgress.userId, userIds))
      .run()
  },
}
