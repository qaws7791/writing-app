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
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  learnerActivityDays,
  learnerLessonProgress,
  lessonStepVersions,
  lessonVersions,
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
              currentStepSortOrder: lessonStepVersions.sortOrder,
              lessonId: learnerLessonProgress.lessonId,
              status: learnerLessonProgress.status,
            })
            .from(learnerLessonProgress)
            .innerJoin(
              lessonStepVersions,
              and(
                eq(
                  lessonStepVersions.curriculumVersionId,
                  learnerLessonProgress.curriculumVersionId
                ),
                eq(lessonStepVersions.lessonId, learnerLessonProgress.lessonId),
                eq(lessonStepVersions.id, learnerLessonProgress.currentStepId)
              )
            )
            .where(eq(learnerLessonProgress.userId, userId))
            .all()
            .map((progress) => ({
              currentStepIndex: progress.currentStepSortOrder - 1,
              lessonId: progress.lessonId,
              status: progress.status,
            }))
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
      .from(lessonVersions)
      .innerJoin(
        courses,
        eq(
          courses.publishedCurriculumVersionId,
          lessonVersions.curriculumVersionId
        )
      )
      .innerJoin(
        courseCurriculumVersions,
        eq(courseCurriculumVersions.id, lessonVersions.curriculumVersionId)
      )
      .innerJoin(
        courseUnitVersions,
        and(
          eq(
            courseUnitVersions.curriculumVersionId,
            lessonVersions.curriculumVersionId
          ),
          eq(courseUnitVersions.id, lessonVersions.unitId)
        )
      )
      .where(
        and(
          eq(courses.status, contentStatuses.active),
          eq(courseCurriculumVersions.status, "published"),
          eq(courseUnitVersions.status, contentStatuses.active),
          eq(lessonVersions.status, contentStatuses.active)
        )
      )
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
