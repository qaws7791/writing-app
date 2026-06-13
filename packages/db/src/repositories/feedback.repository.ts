import { and, count, eq } from "drizzle-orm"

import type { AiFeedbackRepository } from "@workspace/core/ai-feedback"
import type { KwepDatabase } from "@workspace/db/client"
import { aiFeedbackAttempts } from "@workspace/db/schema"

export function createDrizzleAiFeedbackRepository(
  db: KwepDatabase
): AiFeedbackRepository {
  return {
    async countCompletedAttempts(input) {
      return (
        db
          .select({ value: count() })
          .from(aiFeedbackAttempts)
          .where(
            and(
              eq(aiFeedbackAttempts.userId, input.userId),
              eq(aiFeedbackAttempts.lessonId, input.lessonId),
              eq(aiFeedbackAttempts.stepId, input.stepId)
            )
          )
          .get()?.value ?? 0
      )
    },
    async saveAttempt(record) {
      db.insert(aiFeedbackAttempts)
        .values({
          answerText: record.answer,
          attemptNumber: record.attemptNumber,
          createdAt: record.occurredAt,
          lessonId: record.lessonId,
          resultJson: JSON.stringify(record.result),
          stepId: record.stepId,
          userId: record.userId,
        })
        .run()
    },
  }
}
