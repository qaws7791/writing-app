import { inArray } from "drizzle-orm"
import {
  aiFeedbackAttempts,
  aiFeedbackUserDailyCounters,
} from "@workspace/ai-feedback/schema"
import { authUsers } from "@workspace/auth/schema"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  learnerActivityDays,
  learnerCourseProgress,
  learnerLessonAnswers,
  learnerLessonProgress,
  learnerStepDrafts,
} from "@workspace/learning/schema"
import type { UserId } from "@workspace/types/ids"

type WritingAppDatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

export function deleteLearnerOwnedData(
  transaction: WritingAppDatabaseTransaction,
  userIds: readonly UserId[]
): void {
  if (userIds.length === 0) return

  transaction
    .delete(aiFeedbackAttempts)
    .where(inArray(aiFeedbackAttempts.userId, userIds))
    .run()
  transaction
    .delete(aiFeedbackUserDailyCounters)
    .where(inArray(aiFeedbackUserDailyCounters.userId, userIds))
    .run()
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
  transaction.delete(authUsers).where(inArray(authUsers.id, userIds)).run()
}
