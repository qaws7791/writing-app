import { and, count, eq, inArray } from "drizzle-orm"

import type { WritingAppDatabase } from "@workspace/db/client"
import type { UserId } from "@workspace/types/ids"

import type { LearningReportingRepository } from "#learning/application/learning-reporting"
import {
  calculateCurrentStreakDays,
  groupLearningActivityDatesByUserId,
} from "#learning/domain/learning-date"
import {
  learnerActivityDays,
  learnerLessonProgress,
} from "#learning/infrastructure/persistence/schema"

export function createDrizzleLearningReportingRepository(
  database: WritingAppDatabase
): LearningReportingRepository {
  return Object.freeze({
    async readLearnerReports(userIds) {
      if (userIds.length === 0) return []
      const [completionRows, activityRows] = await Promise.all([
        Promise.resolve(
          database
            .select({
              completedLessons: count(),
              userId: learnerLessonProgress.userId,
            })
            .from(learnerLessonProgress)
            .where(
              and(
                inArray(learnerLessonProgress.userId, [...userIds]),
                eq(learnerLessonProgress.status, "completed")
              )
            )
            .groupBy(learnerLessonProgress.userId)
            .all()
        ),
        Promise.resolve(
          database
            .select({
              activityDate: learnerActivityDays.activityDate,
              userId: learnerActivityDays.userId,
            })
            .from(learnerActivityDays)
            .where(inArray(learnerActivityDays.userId, [...userIds]))
            .all()
        ),
      ])
      const completedByUserId = new Map(
        completionRows.map((row) => [row.userId, row.completedLessons])
      )
      const activityByUserId = groupLearningActivityDatesByUserId(activityRows)

      return userIds.map((userId) => {
        const dates = activityByUserId.get(userId) ?? []
        return Object.freeze({
          completedLessons: completedByUserId.get(userId) ?? 0,
          currentStreakDays: calculateCurrentStreakDays(dates),
          lastActive: dates[0] ?? null,
          userId,
        })
      })
    },
    async readOperationsReport() {
      const [completedLessons, learningDays, learners] = await Promise.all([
        Promise.resolve(
          database
            .select({ value: count() })
            .from(learnerLessonProgress)
            .where(eq(learnerLessonProgress.status, "completed"))
            .get()?.value ?? 0
        ),
        Promise.resolve(
          database.select({ value: count() }).from(learnerActivityDays).get()
            ?.value ?? 0
        ),
        Promise.resolve(
          database
            .selectDistinct({ userId: learnerActivityDays.userId })
            .from(learnerActivityDays)
            .all().length
        ),
      ])

      return Object.freeze({
        activeLearners: learners,
        completedLessons,
        learningDays,
      })
    },
  })
}

export function toLearningUserId(value: string): UserId {
  if (value.length === 0) throw new Error("Learning user ID must not be empty")
  return value as UserId
}
