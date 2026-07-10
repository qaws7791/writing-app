import { and, eq, sql } from "drizzle-orm"
import type {
  CompleteLessonRecord,
  SaveLessonProgressCommand,
  SaveStepAnswerCommand,
} from "@workspace/core/modules/learning/domain/learning.dto"
import { learningAnswerSchema } from "@workspace/core/modules/learning/domain/learning.dto"
import type { LearningRepository } from "@workspace/core/modules/learning/application/ports/learning.repository"
import type { FindStepAnswerQuery } from "@workspace/core/modules/learning/application/ports/learning.repository"
import type {
  FindLessonProgressQuery,
  LessonProgressRecord,
} from "@workspace/core/modules/learning/application/ports/learning.repository"
import { toLearningDateKey } from "@workspace/core/modules/learning/domain/learning-date"
import { lessonProgressStatuses } from "@workspace/core/shared/kernel/status"

import type { WritingAppDatabase } from "@workspace/db/client"
import {
  learnerActivityDays,
  learnerLessonAnswers,
  learnerLessonProgress,
} from "@workspace/db/schema"

export type SaveLessonProgressInput = SaveLessonProgressCommand
export type SaveStepAnswerInput = SaveStepAnswerCommand
export type CompleteLessonInput = CompleteLessonRecord

export function createDrizzleLearningRepository(
  db: WritingAppDatabase
): LearningRepository {
  return {
    async completeLesson(input) {
      completeLesson(db, input)
    },
    async findLessonProgress(query) {
      return findLessonProgress(db, query)
    },
    async findStepAnswer(query) {
      return findStepAnswer(db, query)
    },
    async saveLessonProgress(input) {
      saveLessonProgress(db, input)
    },
    async saveStepAnswer(input) {
      saveStepAnswer(db, input)
    },
  }
}

function findLessonProgress(
  db: WritingAppDatabase,
  query: FindLessonProgressQuery
): LessonProgressRecord | null {
  const row = db
    .select({
      currentStepIndex: learnerLessonProgress.currentStepIndex,
      lessonId: learnerLessonProgress.lessonId,
      status: learnerLessonProgress.status,
      userId: learnerLessonProgress.userId,
    })
    .from(learnerLessonProgress)
    .where(
      and(
        eq(learnerLessonProgress.userId, query.userId),
        eq(learnerLessonProgress.lessonId, query.lessonId)
      )
    )
    .get()

  if (
    row === undefined ||
    (row.status !== lessonProgressStatuses.completed &&
      row.status !== lessonProgressStatuses.inProgress)
  ) {
    return null
  }

  return {
    currentStepIndex: row.currentStepIndex,
    lessonId: query.lessonId,
    status: row.status,
    userId: query.userId,
  }
}

function findStepAnswer(db: WritingAppDatabase, query: FindStepAnswerQuery) {
  const row = db
    .select({ answerJson: learnerLessonAnswers.answerJson })
    .from(learnerLessonAnswers)
    .where(
      and(
        eq(learnerLessonAnswers.userId, query.userId),
        eq(learnerLessonAnswers.lessonId, query.lessonId),
        eq(learnerLessonAnswers.stepId, query.stepId)
      )
    )
    .get()

  if (row === undefined) {
    return null
  }

  try {
    const result = learningAnswerSchema.safeParse(JSON.parse(row.answerJson))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

function saveLessonProgress(
  db: WritingAppDatabase,
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

function saveStepAnswer(
  db: WritingAppDatabase,
  input: SaveStepAnswerInput
): void {
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

function completeLesson(
  db: WritingAppDatabase,
  input: CompleteLessonInput
): void {
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
  db: WritingAppDatabase,
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
