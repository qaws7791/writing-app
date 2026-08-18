import type { Clock } from "@workspace/kernel/clock"
import type { UserId } from "@workspace/types/ids"

import type {
  LearningContentQueryPort,
  LearningReportItem,
} from "#learning/application/ports/learning-ports"
import {
  buildRecentCadenceDays,
  toLearningDateKey,
  type LearningCadenceDay,
} from "#learning/domain/learning-date"

export type LearningReportingRepository = Readonly<{
  readLearnerReports: (
    userIds: readonly UserId[]
  ) => Promise<readonly LearningReportItem[]>
}>

export type LearningReportingQuery = Readonly<{
  readActiveLessonCount: () => Promise<number>
  readLearnerReports: (
    userIds: readonly UserId[]
  ) => Promise<readonly LearningReportItem[]>
}>

export type LearningProfileStats = Readonly<{
  completedCourses: number
  completedLessons: number
  currentStreakDays: number
  inProgressCourses: number
  lastActiveDate: string | null
  progressPercent: number
  recentCadenceDays: readonly LearningCadenceDay[]
  totalLessons: number
}>

export type LearningProfileStatsQuery = Readonly<{
  readProfileStats: (userId: UserId) => Promise<LearningProfileStats>
}>

export function createLearningReportingQuery(input: {
  readonly content: Pick<LearningContentQueryPort, "listPublishedCourses">
  readonly repository: LearningReportingRepository
}): LearningReportingQuery {
  return {
    async readActiveLessonCount() {
      const courses = await input.content.listPublishedCourses()
      return courses.reduce((total, course) => total + course.lessonCount, 0)
    },
    readLearnerReports(userIds) {
      return input.repository.readLearnerReports(userIds)
    },
  }
}

export function createLearningProfileStatsQuery(input: {
  readonly clock: Clock
  readonly reporting: LearningReportingQuery
}): LearningProfileStatsQuery {
  return {
    async readProfileStats(userId) {
      const [reports, totalLessons] = await Promise.all([
        input.reporting.readLearnerReports([userId]),
        input.reporting.readActiveLessonCount(),
      ])
      const report = reports[0]
      const completedLessons = report?.completedLessons ?? 0

      return {
        completedCourses: report?.completedCourses ?? 0,
        completedLessons,
        currentStreakDays: report?.currentStreakDays ?? 0,
        inProgressCourses: report?.inProgressCourses ?? 0,
        lastActiveDate: report?.lastActive ?? null,
        progressPercent:
          totalLessons === 0
            ? 0
            : Math.round((completedLessons / totalLessons) * 100),
        recentCadenceDays: buildRecentCadenceDays(
          report?.activityDates ?? [],
          toLearningDateKey(input.clock.now())
        ),
        totalLessons,
      }
    },
  }
}
