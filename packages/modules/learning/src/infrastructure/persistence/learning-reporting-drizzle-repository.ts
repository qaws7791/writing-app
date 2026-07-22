import { and, count, eq, inArray } from "drizzle-orm"

import type { WritingAppDatabase } from "@workspace/db/client"
import type { LessonId, UserId } from "@workspace/types/ids"

import type { LearningReportingRepository } from "#learning/application/learning-reporting"
import {
  calculateCurrentStreakDays,
  groupLearningActivityDatesByUserId,
  toLearningDateKey,
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
      const [activityRows, progressRows] = await Promise.all([
        Promise.resolve(
          database
            .select({
              activityDate: learnerActivityDays.activityDate,
              userId: learnerActivityDays.userId,
            })
            .from(learnerActivityDays)
            .all()
        ),
        Promise.resolve(
          database
            .select({
              completedAt: learnerLessonProgress.completedAt,
              lessonId: learnerLessonProgress.lessonId,
              status: learnerLessonProgress.status,
              userId: learnerLessonProgress.userId,
            })
            .from(learnerLessonProgress)
            .all()
        ),
      ])
      const activitiesByUserId =
        groupLearningActivityDatesByUserId(activityRows)

      return Object.freeze({
        learnerActivities: Object.freeze(
          [...activitiesByUserId].flatMap(([userId, dates]) => {
            const lastActiveDate = dates[0]
            return lastActiveDate === undefined
              ? []
              : [
                  Object.freeze({
                    currentStreakDays: calculateCurrentStreakDays(dates),
                    lastActiveDate,
                    userId: userId as UserId,
                  }),
                ]
          })
        ),
        lessonProgress: Object.freeze(
          progressRows.map((row) =>
            Object.freeze({
              completedAt:
                row.completedAt === null
                  ? null
                  : toLearningDateKey(row.completedAt),
              lessonId: row.lessonId as LessonId,
              status: row.status,
              userId: row.userId as UserId,
            })
          )
        ),
      })
    },
  })
}

export function toLearningUserId(value: string): UserId {
  if (value.length === 0) throw new Error("Learning user ID must not be empty")
  return value as UserId
}
