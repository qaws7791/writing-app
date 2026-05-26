import { and, count, eq } from "drizzle-orm"

import type {
  AiFeedbackRepository,
  CreateCompletedFeedbackAttemptInput,
} from "@workspace/core/ai-feedback"

import type { WritingAppDatabase } from "@/client"
import { feedbackAttempts } from "@/schema/learning.schema"

export interface DrizzleFeedbackRepositoryOptions {
  now?: () => Date
}

export function createDrizzleFeedbackRepository(
  db: WritingAppDatabase,
  options: DrizzleFeedbackRepositoryOptions = {}
): AiFeedbackRepository {
  const now = options.now ?? (() => new Date())

  return {
    async countCompletedAttempts(userId, lessonId, feedbackStepId) {
      const [row] = await db
        .select({ attemptCount: count() })
        .from(feedbackAttempts)
        .where(
          and(
            eq(feedbackAttempts.userId, userId),
            eq(feedbackAttempts.lessonId, lessonId),
            eq(feedbackAttempts.feedbackStepId, feedbackStepId),
            eq(feedbackAttempts.status, "completed")
          )
        )

      return row?.attemptCount ?? 0
    },

    async createCompletedAttempt(input) {
      await db
        .insert(feedbackAttempts)
        .values(mapCompletedAttempt(input, now()))
    },
  }
}

function mapCompletedAttempt(
  input: CreateCompletedFeedbackAttemptInput,
  createdAt: Date
) {
  return {
    userId: input.userId,
    lessonId: input.lessonId,
    feedbackStepId: input.feedbackStepId,
    sourceStepId: input.sourceStepId,
    attemptNumber: input.attemptNumber,
    answerSnapshot: input.answerSnapshot,
    resultJson: JSON.stringify(input.result),
    status: "completed" as const,
    createdAt,
  }
}
