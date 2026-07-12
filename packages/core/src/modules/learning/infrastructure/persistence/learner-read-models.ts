import { and, count, desc, eq } from "drizzle-orm"

import {
  calculateCurrentStreakDays,
  type LearningDateKey,
} from "#core/modules/learning/domain/learning-date"
import { learnerProfileStatsDtoSchema } from "#core/modules/learning/domain/learner-read-model.dto"
import type { ProfileReader } from "#core/modules/learning/domain/learner-profile-read-model"
import type { ProgressReader } from "#core/modules/learning/domain/learning-progress-read-model"
import {
  contentStatuses,
  lessonProgressStatuses,
} from "#core/shared/kernel/status"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  learnerActivityDays,
  learnerLessonProgress,
  lessons,
} from "@workspace/db/schema"

export function createDrizzleProfileReader(
  db: WritingAppDatabase
): ProfileReader {
  return {
    async readProfileStats(userId) {
      const [completedLessons, totalLessons, activity] = await Promise.all([
        countCompletedLessons(db, userId),
        countActiveLessons(db),
        readActivity(db, userId),
      ])

      return learnerProfileStatsDtoSchema.parse({
        completedLessons,
        currentStreakDays: calculateCurrentStreakDays(
          activity.map((day) => day.activityDate)
        ),
        lastActiveDate: activity[0]?.activityDate ?? null,
        progressPercent:
          totalLessons === 0
            ? 0
            : Math.round((completedLessons / totalLessons) * 100),
        totalLessons,
      })
    },
  }
}

export function createDrizzleProgressReader(
  db: WritingAppDatabase
): ProgressReader {
  return {
    async readLearnerProgress(userId) {
      const [progressRows, activity] = await Promise.all([
        Promise.resolve(
          db
            .select({
              currentStepIndex: learnerLessonProgress.currentStepIndex,
              lessonId: learnerLessonProgress.lessonId,
              status: learnerLessonProgress.status,
            })
            .from(learnerLessonProgress)
            .where(eq(learnerLessonProgress.userId, userId))
            .all()
        ),
        readActivity(db, userId),
      ])

      return {
        currentStreakDays: calculateCurrentStreakDays(
          activity.map((day) => day.activityDate)
        ),
        lessonProgress: progressRows,
      }
    },
  }
}

function countCompletedLessons(
  db: WritingAppDatabase,
  userId: string
): Promise<number> {
  return Promise.resolve(
    db
      .select({ value: count() })
      .from(learnerLessonProgress)
      .where(
        and(
          eq(learnerLessonProgress.userId, userId),
          eq(learnerLessonProgress.status, lessonProgressStatuses.completed)
        )
      )
      .get()?.value ?? 0
  )
}

function countActiveLessons(db: WritingAppDatabase): Promise<number> {
  return Promise.resolve(
    db
      .select({ value: count() })
      .from(lessons)
      .where(eq(lessons.status, contentStatuses.active))
      .get()?.value ?? 0
  )
}

function readActivity(db: WritingAppDatabase, userId: string) {
  return Promise.resolve(
    db
      .select({ activityDate: learnerActivityDays.activityDate })
      .from(learnerActivityDays)
      .where(eq(learnerActivityDays.userId, userId))
      .orderBy(desc(learnerActivityDays.activityDate))
      .all()
      .map((activity) => ({
        activityDate: activity.activityDate as LearningDateKey,
      }))
  )
}
