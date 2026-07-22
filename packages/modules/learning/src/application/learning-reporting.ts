import type { UserId } from "@workspace/types/ids"

import type {
  LearningContentQueryPort,
  LearningReportItem,
} from "#learning/application/ports/learning-ports"

export type LearningOperationsReport = Readonly<{
  activeLearners: number
  completedLessons: number
  learningDays: number
}>

export type LearningReportingRepository = Readonly<{
  readLearnerReports: (
    userIds: readonly UserId[]
  ) => Promise<readonly LearningReportItem[]>
  readOperationsReport: () => Promise<LearningOperationsReport>
}>

export type LearningReportingQuery = Readonly<{
  readActiveLessonCount: () => Promise<number>
  readLearnerReports: (
    userIds: readonly UserId[]
  ) => Promise<readonly LearningReportItem[]>
  readOperationsReport: () => Promise<LearningOperationsReport>
}>

export type LearningProfileStats = Readonly<{
  completedLessons: number
  currentStreakDays: number
  lastActiveDate: string | null
  progressPercent: number
  totalLessons: number
}>

export type LearningProfileStatsQuery = Readonly<{
  readProfileStats: (userId: UserId) => Promise<LearningProfileStats>
}>

export function createLearningReportingQuery(input: {
  readonly content: Pick<LearningContentQueryPort, "listPublishedCourses">
  readonly repository: LearningReportingRepository
}): LearningReportingQuery {
  return Object.freeze({
    async readActiveLessonCount() {
      const courses = await input.content.listPublishedCourses()
      return courses.reduce((total, course) => total + course.lessonCount, 0)
    },
    readLearnerReports(userIds) {
      return input.repository.readLearnerReports(userIds)
    },
    readOperationsReport() {
      return input.repository.readOperationsReport()
    },
  })
}

export function createLearningProfileStatsQuery(input: {
  readonly reporting: LearningReportingQuery
}): LearningProfileStatsQuery {
  return Object.freeze({
    async readProfileStats(userId) {
      const [reports, totalLessons] = await Promise.all([
        input.reporting.readLearnerReports([userId]),
        input.reporting.readActiveLessonCount(),
      ])
      const report = reports[0]
      const completedLessons = report?.completedLessons ?? 0

      return Object.freeze({
        completedLessons,
        currentStreakDays: report?.currentStreakDays ?? 0,
        lastActiveDate: report?.lastActive ?? null,
        progressPercent:
          totalLessons === 0
            ? 0
            : Math.round((completedLessons / totalLessons) * 100),
        totalLessons,
      })
    },
  })
}
