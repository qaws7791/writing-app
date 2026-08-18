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
  learnerCourseProgress,
  learnerLessonProgress,
} from "#learning/infrastructure/persistence/schema"

export function createDrizzleLearningReportingRepository(
  database: WritingAppDatabase
): LearningReportingRepository {
  return {
    async readLearnerReports(userIds) {
      if (userIds.length === 0) return []
      const [completionRows, activityRows, courseCountRows] = await Promise.all(
        [
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
          Promise.resolve(
            database
              .select({
                courseCount: count(),
                status: learnerCourseProgress.status,
                userId: learnerCourseProgress.userId,
              })
              .from(learnerCourseProgress)
              .where(inArray(learnerCourseProgress.userId, [...userIds]))
              .groupBy(
                learnerCourseProgress.userId,
                learnerCourseProgress.status
              )
              .all()
          ),
        ]
      )
      const completedByUserId = new Map(
        completionRows.map((row) => [row.userId, row.completedLessons])
      )
      const activityByUserId = groupLearningActivityDatesByUserId(activityRows)
      const courseCountsByUserId = new Map<
        string,
        { completedCourses: number; inProgressCourses: number }
      >()
      for (const row of courseCountRows) {
        const current = courseCountsByUserId.get(row.userId) ?? {
          completedCourses: 0,
          inProgressCourses: 0,
        }
        if (row.status === "completed") {
          current.completedCourses = row.courseCount
        } else {
          current.inProgressCourses = row.courseCount
        }
        courseCountsByUserId.set(row.userId, current)
      }

      return userIds.map((userId) => {
        const dates = activityByUserId.get(userId) ?? []
        const courseCounts = courseCountsByUserId.get(userId)
        return {
          activityDates: dates,
          completedCourses: courseCounts?.completedCourses ?? 0,
          completedLessons: completedByUserId.get(userId) ?? 0,
          currentStreakDays: calculateCurrentStreakDays(dates),
          inProgressCourses: courseCounts?.inProgressCourses ?? 0,
          lastActive: dates[0] ?? null,
          userId,
        }
      })
    },
  }
}

export function toLearningUserId(value: string): UserId {
  if (value.length === 0) throw new Error("Learning user ID must not be empty")
  return value as UserId
}
