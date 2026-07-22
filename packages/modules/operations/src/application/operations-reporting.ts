import { err, ok, type Result } from "@workspace/kernel/result"
import type { CourseId, LessonId, UserId } from "@workspace/types/ids"

import type { OperationsError } from "#operations/domain/operations-error"
import type {
  OperationsContentReport,
  OperationsIdentitySnapshot,
  OperationsLearningReport,
  OperationsReportingFailureObserver,
  OperationsReportingPorts,
} from "#operations/application/ports/operations-ports"

type ReportingSnapshot = Readonly<{
  content: OperationsContentReport
  identity: readonly OperationsIdentitySnapshot[]
  learning: OperationsLearningReport
}>

type LessonAnalyticsSort = "completionRate" | "course" | "dropOff" | "lesson"
type SortDirection = "asc" | "desc"

export type OperationsDashboard = Readonly<{
  metrics: Readonly<{
    activeCourses: number
    activeLessons: number
    activeUsersLast7Days: number
    completedLessons: number
    signupsLast7Days: number
    signupsToday: number
    totalUsers: number
  }>
  recentActivities: readonly Readonly<{
    currentStreakDays: number
    email: string
    lastActiveDate: string | null
    name: string
    userId: UserId
  }>[]
}>

export type OperationsLessonAnalyticsItem = Readonly<{
  completed: number
  completionRate: number
  courseId: CourseId
  courseTitle: string
  dropOffRate: number
  lessonId: LessonId
  lessonTitle: string
  started: number
}>

export type OperationsAnalytics = Readonly<{
  dailySeries: readonly Readonly<{
    completions: number
    date: string
    signups: number
  }>[]
  streakBuckets: readonly Readonly<{ count: number; label: string }>[]
  worstLessons: readonly OperationsLessonAnalyticsItem[]
}>

export type OperationsReportingQueries = Readonly<{
  readAnalytics: (
    input: Readonly<{ days: number; now: Date }>
  ) => Promise<Result<OperationsAnalytics, OperationsError>>
  readDashboard: (
    input: Readonly<{ now: Date }>
  ) => Promise<Result<OperationsDashboard, OperationsError>>
  readLessonAnalytics: (
    input: Readonly<{
      direction: SortDirection
      page: number
      pageSize: number
      query: string
      sort: LessonAnalyticsSort
    }>
  ) => Promise<
    Result<
      Readonly<{
        items: readonly OperationsLessonAnalyticsItem[]
        page: number
        pageSize: number
        totalItems: number
        totalPages: number
      }>,
      OperationsError
    >
  >
}>

const streakBuckets = [
  { label: "0일", max: 0, min: 0 },
  { label: "1-3일", max: 3, min: 1 },
  { label: "4-7일", max: 7, min: 4 },
  { label: "8-14일", max: 14, min: 8 },
  { label: "15일+", max: Number.POSITIVE_INFINITY, min: 15 },
] as const

export function createOperationsReportingQueries(input: {
  readonly observer: OperationsReportingFailureObserver
  readonly ports: OperationsReportingPorts
}): OperationsReportingQueries {
  return Object.freeze({
    async readAnalytics(query) {
      const report = await readReportingSnapshot(input)
      if (report.isErr()) return err(report.error)
      const lessonAnalytics = createLessonAnalytics(report.value)
      return ok({
        dailySeries: createDailySeries(report.value, query),
        streakBuckets: createStreakBuckets(report.value),
        worstLessons: [...lessonAnalytics].sort(compareWorstLesson).slice(0, 8),
      })
    },
    async readDashboard(query) {
      const report = await readReportingSnapshot(input)
      return report.map((snapshot) => createDashboard(snapshot, query.now))
    },
    async readLessonAnalytics(query) {
      const report = await readReportingSnapshot(input)
      if (report.isErr()) return err(report.error)
      const normalizedQuery = query.query.trim().toLowerCase()
      const items = createLessonAnalytics(report.value)
        .filter(
          (item) =>
            normalizedQuery.length === 0 ||
            item.courseTitle.toLowerCase().includes(normalizedQuery) ||
            item.lessonTitle.toLowerCase().includes(normalizedQuery)
        )
        .sort(createLessonComparator(query.sort, query.direction))
      const totalItems = items.length
      const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize))
      const page = Math.min(Math.max(1, query.page), totalPages)
      return ok({
        items: items.slice((page - 1) * query.pageSize, page * query.pageSize),
        page,
        pageSize: query.pageSize,
        totalItems,
        totalPages,
      })
    },
  })
}

async function readReportingSnapshot(input: {
  readonly observer: OperationsReportingFailureObserver
  readonly ports: OperationsReportingPorts
}): Promise<Result<ReportingSnapshot, OperationsError>> {
  const sources = ["identity", "content", "learning"] as const
  const [identity, content, learning] = await Promise.allSettled([
    input.ports.identity.readNonDeletedLearners(),
    input.ports.content.readContentReport(),
    input.ports.learning.readOperationsReport(),
  ] as const)
  const failed = [identity, content, learning].flatMap((result, index) => {
    if (result.status === "fulfilled") return []
    const source = sources[index]
    if (source === undefined) return []
    input.observer({ kind: "operations-reporting-source-failed", source })
    return [source]
  })
  if (failed.length > 0) {
    return err({ kind: "reporting-unavailable", sources: failed })
  }

  return ok({
    content: readFulfilled(content),
    identity: readFulfilled(identity),
    learning: readFulfilled(learning),
  })
}

function readFulfilled<T>(result: PromiseSettledResult<T>): T {
  if (result.status === "rejected") throw result.reason
  return result.value
}

function createDashboard(
  report: ReportingSnapshot,
  now: Date
): OperationsDashboard {
  const today = toDateKey(now)
  const start = addDays(today, -6)
  const learnersById = new Map(report.identity.map((item) => [item.id, item]))
  const validActivities = report.learning.learnerActivities.filter((item) =>
    learnersById.has(item.userId)
  )
  const validProgress = report.learning.lessonProgress.filter((item) =>
    learnersById.has(item.userId)
  )

  return {
    metrics: {
      activeCourses: report.content.activeCourses,
      activeLessons: report.content.activeLessons,
      activeUsersLast7Days: validActivities.filter(
        (item) => item.lastActiveDate >= start && item.lastActiveDate <= today
      ).length,
      completedLessons: validProgress.filter(
        (item) => item.status === "completed"
      ).length,
      signupsLast7Days: report.identity.filter((item) => {
        const date = toDateKey(item.createdAt)
        return date >= start && date <= today
      }).length,
      signupsToday: report.identity.filter(
        (item) => toDateKey(item.createdAt) === today
      ).length,
      totalUsers: report.identity.length,
    },
    recentActivities: validActivities
      .flatMap((activity) => {
        const learner = learnersById.get(activity.userId)
        return learner === undefined
          ? []
          : [
              {
                currentStreakDays: activity.currentStreakDays,
                email: learner.email,
                lastActiveDate: activity.lastActiveDate,
                name: learner.name,
                userId: learner.id,
              },
            ]
      })
      .sort(
        (left, right) =>
          right.lastActiveDate.localeCompare(left.lastActiveDate) ||
          left.name.localeCompare(right.name)
      )
      .slice(0, 5),
  }
}

function createDailySeries(
  report: ReportingSnapshot,
  input: Readonly<{ days: number; now: Date }>
): OperationsAnalytics["dailySeries"] {
  const learnerIds = new Set(report.identity.map((item) => item.id))
  const signups = countDates(
    report.identity.map((item) => toDateKey(item.createdAt))
  )
  const completions = countDates(
    report.learning.lessonProgress.flatMap((item) =>
      item.status === "completed" &&
      item.completedAt !== null &&
      learnerIds.has(item.userId)
        ? [item.completedAt]
        : []
    )
  )
  const start = addDays(toDateKey(input.now), -(input.days - 1))
  return Array.from({ length: input.days }, (_, index) => {
    const date = addDays(start, index)
    return {
      completions: completions.get(date) ?? 0,
      date,
      signups: signups.get(date) ?? 0,
    }
  })
}

function createStreakBuckets(
  report: ReportingSnapshot
): OperationsAnalytics["streakBuckets"] {
  const activityByUserId = new Map(
    report.learning.learnerActivities.map((item) => [item.userId, item])
  )
  const counts = new Map(streakBuckets.map((bucket) => [bucket.label, 0]))
  for (const learner of report.identity) {
    const streak = activityByUserId.get(learner.id)?.currentStreakDays ?? 0
    const bucket = streakBuckets.find(
      (candidate) => streak >= candidate.min && streak <= candidate.max
    )
    if (bucket !== undefined) {
      counts.set(bucket.label, (counts.get(bucket.label) ?? 0) + 1)
    }
  }
  return streakBuckets.map((bucket) => ({
    count: counts.get(bucket.label) ?? 0,
    label: bucket.label,
  }))
}

function createLessonAnalytics(
  report: ReportingSnapshot
): OperationsLessonAnalyticsItem[] {
  const learnerIds = new Set(report.identity.map((item) => item.id))
  return report.content.lessons.map((lesson) => {
    const progress = report.learning.lessonProgress.filter(
      (item) => item.lessonId === lesson.lessonId && learnerIds.has(item.userId)
    )
    const started = new Set(progress.map((item) => item.userId)).size
    const completed = new Set(
      progress
        .filter((item) => item.status === "completed")
        .map((item) => item.userId)
    ).size
    const completionRate =
      started === 0 ? 0 : Math.round((completed / started) * 100)
    return {
      ...lesson,
      completed,
      completionRate,
      dropOffRate: 100 - completionRate,
      started,
    }
  })
}

function createLessonComparator(
  sort: LessonAnalyticsSort,
  direction: SortDirection
) {
  const factor = direction === "asc" ? 1 : -1
  return (
    left: OperationsLessonAnalyticsItem,
    right: OperationsLessonAnalyticsItem
  ) => {
    const primary = (() => {
      switch (sort) {
        case "course":
          return left.courseTitle.localeCompare(right.courseTitle)
        case "completionRate":
          return left.completionRate - right.completionRate
        case "dropOff":
          return left.dropOffRate - right.dropOffRate
        case "lesson":
          return left.lessonTitle.localeCompare(right.lessonTitle)
      }
    })()
    return primary * factor || left.lessonTitle.localeCompare(right.lessonTitle)
  }
}

function compareWorstLesson(
  left: OperationsLessonAnalyticsItem,
  right: OperationsLessonAnalyticsItem
) {
  return (
    left.completionRate - right.completionRate ||
    right.dropOffRate - left.dropOffRate ||
    left.lessonTitle.localeCompare(right.lessonTitle)
  )
}

function countDates(dates: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const date of dates) counts.set(date, (counts.get(date) ?? 0) + 1)
  return counts
}

function toDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).format(date)
}

function addDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}
