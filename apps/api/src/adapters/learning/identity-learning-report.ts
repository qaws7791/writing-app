import { and, count, eq, inArray } from "drizzle-orm"
import { lessonProgressStatuses } from "@workspace/contracts/learning/status"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdentityLearningReportPort } from "@workspace/identity/ports"
import {
  calculateCurrentStreakDays,
  type LearningDateKey,
} from "@workspace/core/learning"
import {
  learnerActivityDays,
  learnerLessonProgress,
} from "@workspace/db/schema"

import { readActiveLessonCount } from "@/adapters/learning/learner-read-models"

export function createIdentityLearningReport(
  database: WritingAppDatabase
): IdentityLearningReportPort {
  return {
    readActiveLessonCount: () => readActiveLessonCount(database),
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
                eq(
                  learnerLessonProgress.status,
                  lessonProgressStatuses.completed
                )
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
      const activityByUserId = new Map<string, LearningDateKey[]>()
      for (const row of activityRows) {
        const dates = activityByUserId.get(row.userId) ?? []
        dates.push(row.activityDate as LearningDateKey)
        activityByUserId.set(row.userId, dates)
      }

      return userIds.map((userId) => {
        const dates = (activityByUserId.get(userId) ?? []).sort((left, right) =>
          right.localeCompare(left)
        )
        return {
          completedLessons: completedByUserId.get(userId) ?? 0,
          currentStreakDays: calculateCurrentStreakDays(dates),
          lastActive: dates[0] ?? null,
          userId,
        }
      })
    },
  }
}
