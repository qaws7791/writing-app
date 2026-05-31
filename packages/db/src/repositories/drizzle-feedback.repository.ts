import { and, count, eq, max } from "drizzle-orm"

import type {
  AiFeedbackRepository,
  CreateNextCompletedFeedbackAttemptInput,
} from "@workspace/core/ai-feedback"

import type { WritingAppDatabase } from "../client"
import { feedbackAttempts } from "../schema/learning.schema"

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

    async createNextCompletedAttempt(input) {
      return createNextCompletedAttempt({
        db,
        input,
        now,
      })
    },
  }
}

async function createNextCompletedAttempt({
  db,
  input,
  now,
}: {
  db: WritingAppDatabase
  input: CreateNextCompletedFeedbackAttemptInput
  now: () => Date
}) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await db.transaction(async (tx) => {
        const [row] = await tx
          .select({ maxAttemptNumber: max(feedbackAttempts.attemptNumber) })
          .from(feedbackAttempts)
          .where(
            and(
              eq(feedbackAttempts.userId, input.userId),
              eq(feedbackAttempts.lessonId, input.lessonId),
              eq(feedbackAttempts.feedbackStepId, input.feedbackStepId),
              eq(feedbackAttempts.status, "completed")
            )
          )
        const attemptNumber = (row?.maxAttemptNumber ?? 0) + 1

        if (attemptNumber > input.maxAttempts) {
          return { status: "retry-limit-exceeded" as const }
        }

        await tx
          .insert(feedbackAttempts)
          .values(mapCompletedAttempt(input, attemptNumber, now()))

        return { attemptNumber, status: "created" as const }
      })
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error
      }
    }
  }

  return { status: "retry-limit-exceeded" as const }
}

function mapCompletedAttempt(
  input: CreateNextCompletedFeedbackAttemptInput,
  attemptNumber: number,
  createdAt: Date
) {
  return {
    userId: input.userId,
    lessonId: input.lessonId,
    feedbackStepId: input.feedbackStepId,
    sourceStepId: input.sourceStepId,
    attemptNumber,
    answerSnapshot: input.answerSnapshot,
    resultJson: JSON.stringify(input.result),
    status: "completed" as const,
    createdAt,
  }
}

function isUniqueConstraintError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const code = "code" in error ? String(error.code) : ""

  return (
    code === "SQLITE_CONSTRAINT_UNIQUE" ||
    error.message.includes("UNIQUE constraint failed")
  )
}
