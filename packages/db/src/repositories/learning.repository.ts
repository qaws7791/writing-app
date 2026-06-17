import { and, eq, sql } from "drizzle-orm"
import type {
  CompleteLessonCommand,
  SaveLessonProgressCommand,
  SaveStepAnswerCommand,
} from "@workspace/core/learning"
import { lessonProgressStatuses } from "@workspace/core/status"

import type { KwepDatabase } from "@workspace/db/client"
import { toLearningDateKey } from "@workspace/db/repositories/activity-date"
import {
  learnerActivityDays,
  learnerLessonAnswers,
  learnerLessonProgress,
} from "@workspace/db/schema"

export type SaveLessonProgressInput = SaveLessonProgressCommand
export type SaveStepAnswerInput = SaveStepAnswerCommand
export type CompleteLessonInput = CompleteLessonCommand

export type LearningRepository = {
  readonly completeLesson: (input: CompleteLessonInput) => Promise<void>
  readonly saveLessonProgress: (input: SaveLessonProgressInput) => Promise<void>
  readonly saveStepAnswer: (input: SaveStepAnswerInput) => Promise<void>
}

export function createDrizzleLearningRepository(
  db: KwepDatabase
): LearningRepository {
  return {
    async completeLesson(input) {
      completeLesson(db, input)
    },
    async saveLessonProgress(input) {
      saveLessonProgress(db, input)
    },
    async saveStepAnswer(input) {
      saveStepAnswer(db, input)
    },
  }
}

function saveLessonProgress(
  db: KwepDatabase,
  input: SaveLessonProgressInput
): void {
  db.insert(learnerLessonProgress)
    .values({
      completedAt: null,
      currentStepIndex: input.currentStepIndex,
      lessonId: input.lessonId,
      startedAt: input.occurredAt,
      status: lessonProgressStatuses.inProgress,
      updatedAt: input.occurredAt,
      userId: input.userId,
    })
    .onConflictDoUpdate({
      set: {
        currentStepIndex: input.currentStepIndex,
        updatedAt: input.occurredAt,
      },
      target: [learnerLessonProgress.userId, learnerLessonProgress.lessonId],
    })
    .run()

  recordActivityDay(db, {
    completedLessons: 0,
    occurredAt: input.occurredAt,
    savedAnswers: 0,
    userId: input.userId,
  })
}

function saveStepAnswer(db: KwepDatabase, input: SaveStepAnswerInput): void {
  db.insert(learnerLessonAnswers)
    .values({
      answerJson: JSON.stringify(input.answer),
      answeredAt: input.occurredAt,
      lessonId: input.lessonId,
      stepId: input.stepId,
      updatedAt: input.occurredAt,
      userId: input.userId,
    })
    .onConflictDoUpdate({
      set: {
        answerJson: JSON.stringify(input.answer),
        lessonId: input.lessonId,
        updatedAt: input.occurredAt,
      },
      target: [learnerLessonAnswers.userId, learnerLessonAnswers.stepId],
    })
    .run()

  recordActivityDay(db, {
    completedLessons: 0,
    occurredAt: input.occurredAt,
    savedAnswers: 1,
    userId: input.userId,
  })
}

function completeLesson(db: KwepDatabase, input: CompleteLessonInput): void {
  const existingProgress = db
    .select()
    .from(learnerLessonProgress)
    .where(
      and(
        eq(learnerLessonProgress.userId, input.userId),
        eq(learnerLessonProgress.lessonId, input.lessonId)
      )
    )
    .get()
  const wasCompleted =
    existingProgress?.status === lessonProgressStatuses.completed

  db.insert(learnerLessonProgress)
    .values({
      completedAt: input.occurredAt,
      currentStepIndex: input.currentStepIndex,
      lessonId: input.lessonId,
      startedAt: input.occurredAt,
      status: lessonProgressStatuses.completed,
      updatedAt: input.occurredAt,
      userId: input.userId,
    })
    .onConflictDoUpdate({
      set: {
        completedAt: existingProgress?.completedAt ?? input.occurredAt,
        currentStepIndex: input.currentStepIndex,
        status: lessonProgressStatuses.completed,
        updatedAt: input.occurredAt,
      },
      target: [learnerLessonProgress.userId, learnerLessonProgress.lessonId],
    })
    .run()

  recordActivityDay(db, {
    completedLessons: wasCompleted ? 0 : 1,
    occurredAt: input.occurredAt,
    savedAnswers: 0,
    userId: input.userId,
  })
}

function recordActivityDay(
  db: KwepDatabase,
  input: {
    readonly completedLessons: number
    readonly occurredAt: Date
    readonly savedAnswers: number
    readonly userId: string
  }
): void {
  db.insert(learnerActivityDays)
    .values({
      activityDate: toLearningDateKey(input.occurredAt),
      completedLessons: input.completedLessons,
      firstActivityAt: input.occurredAt,
      lastActivityAt: input.occurredAt,
      savedAnswers: input.savedAnswers,
      userId: input.userId,
    })
    .onConflictDoUpdate({
      set: {
        completedLessons: sql`${learnerActivityDays.completedLessons} + ${input.completedLessons}`,
        lastActivityAt: input.occurredAt,
        savedAnswers: sql`${learnerActivityDays.savedAnswers} + ${input.savedAnswers}`,
      },
      target: [learnerActivityDays.userId, learnerActivityDays.activityDate],
    })
    .run()
}
