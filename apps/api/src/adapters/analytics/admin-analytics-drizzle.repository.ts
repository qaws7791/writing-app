import type {
  AdminAnalyticsDto,
  AdminLessonAnalyticsItemDto,
  AdminLessonAnalyticsSort,
  AdminSortDirection,
} from "@workspace/contracts/operations/dashboard-analytics-data"
import { contentStatuses } from "@workspace/contracts/content/status"
import { lessonProgressStatuses } from "@workspace/contracts/learning/status"
import {
  courseIdSchema,
  lessonIdSchema,
} from "@workspace/contracts/content/ids"
import {
  createAdminPageBounds,
  type AdminAnalyticsReader,
  type ReadAdminAnalyticsInput,
  type ReadAdminLessonAnalyticsInput,
  type ReadAdminLessonAnalyticsResult,
} from "@workspace/core/admin"
import {
  addLearningCalendarDays,
  calculateCurrentStreakDays,
  groupLearningActivityDatesByUserId,
  toLearningDateKey,
  type LearningDateKey,
} from "@workspace/core/learning"
import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  OperationsIdentityReportingQuery,
  OperationsIdentitySnapshot,
} from "@workspace/identity/queries"
import {
  learnerActivityDays,
  learnerLessonProgress,
} from "@workspace/db/schema"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonVersions,
} from "@workspace/content/schema"
import { and, eq } from "drizzle-orm"

const streakBucketRanges = [
  { label: "0일", max: 0, min: 0 },
  { label: "1-3일", max: 3, min: 1 },
  { label: "4-7일", max: 7, min: 4 },
  { label: "8-14일", max: 14, min: 8 },
  { label: "15일+", max: Number.POSITIVE_INFINITY, min: 15 },
] as const

type AdminLessonAnalyticsSnapshot = AdminLessonAnalyticsItemDto

export function createAdminAnalyticsRepository(
  database: WritingAppDatabase,
  identityReporting: OperationsIdentityReportingQuery
): AdminAnalyticsReader {
  return {
    async readAnalytics(input) {
      const learners = await identityReporting.readNonDeletedLearners()
      const lessonAnalytics = createLessonAnalyticsSnapshots(database, learners)

      return {
        dailySeries: createDailySeries(database, input, learners),
        streakBuckets: createStreakBuckets(database, learners),
        worstLessons: [...lessonAnalytics]
          .sort(compareWorstLessons)
          .slice(0, 8),
      }
    },
    async readLessonAnalytics(input) {
      const learners = await identityReporting.readNonDeletedLearners()
      return readLessonAnalytics(database, input, learners)
    },
  }
}

function readLessonAnalytics(
  database: WritingAppDatabase,
  input: ReadAdminLessonAnalyticsInput,
  learners: readonly OperationsIdentitySnapshot[]
): ReadAdminLessonAnalyticsResult {
  const query = input.query.trim().toLowerCase()
  const items = createLessonAnalyticsSnapshots(database, learners)
    .filter(
      (item) =>
        query.length === 0 ||
        item.lessonTitle.toLowerCase().includes(query) ||
        item.courseTitle.toLowerCase().includes(query)
    )
    .sort(createLessonAnalyticsComparator(input.sort, input.direction))
  const pagination = createAdminPageBounds(input, items.length)

  return {
    items: items.slice(
      pagination.offset,
      pagination.offset + pagination.pageSize
    ),
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  }
}

function createDailySeries(
  database: WritingAppDatabase,
  input: ReadAdminAnalyticsInput,
  learners: readonly OperationsIdentitySnapshot[]
): AdminAnalyticsDto["dailySeries"] {
  const learnerIds = new Set<string>(learners.map(({ id }) => id))
  const signupsByDate = countByDate(
    learners.map(({ createdAt }) => toLearningDateKey(createdAt))
  )
  const completionsByDate = countByDate(
    database
      .select()
      .from(learnerLessonProgress)
      .all()
      .filter(
        (progress) =>
          progress.status === lessonProgressStatuses.completed &&
          progress.completedAt !== null &&
          learnerIds.has(progress.userId)
      )
      .map((progress) => toLearningDateKey(progress.completedAt as Date))
  )
  const startDate = addLearningCalendarDays(
    toLearningDateKey(input.now),
    -(input.days - 1)
  )

  return Array.from({ length: input.days }, (_, index) => {
    const date = addLearningCalendarDays(startDate, index)

    return {
      completions: completionsByDate.get(date) ?? 0,
      date,
      signups: signupsByDate.get(date) ?? 0,
    }
  })
}

function createStreakBuckets(
  database: WritingAppDatabase,
  learners: readonly OperationsIdentitySnapshot[]
): AdminAnalyticsDto["streakBuckets"] {
  const activitiesByUserId = groupLearningActivityDatesByUserId(
    database.select().from(learnerActivityDays).all()
  )
  const counts = new Map(streakBucketRanges.map((bucket) => [bucket.label, 0]))

  for (const learner of learners) {
    const streak = calculateCurrentStreakDays(
      activitiesByUserId.get(learner.id) ?? []
    )
    const bucket = streakBucketRanges.find(
      (range) => streak >= range.min && streak <= range.max
    )

    if (bucket !== undefined) {
      counts.set(bucket.label, (counts.get(bucket.label) ?? 0) + 1)
    }
  }

  return streakBucketRanges.map((bucket) => ({
    count: counts.get(bucket.label) ?? 0,
    label: bucket.label,
  }))
}

function createLessonAnalyticsSnapshots(
  database: WritingAppDatabase,
  learners: readonly OperationsIdentitySnapshot[]
): AdminLessonAnalyticsSnapshot[] {
  const learnerIds = new Set<string>(learners.map(({ id }) => id))
  const progressRows = database
    .select()
    .from(learnerLessonProgress)
    .all()
    .filter((progress) => learnerIds.has(progress.userId))

  return readActiveLessonSnapshots(database).map((lesson) => {
    const lessonProgressRows = progressRows.filter(
      (progress) => progress.lessonId === lesson.lessonId
    )
    const started = new Set(lessonProgressRows.map(({ userId }) => userId)).size
    const completed = new Set(
      lessonProgressRows
        .filter(
          (progress) => progress.status === lessonProgressStatuses.completed
        )
        .map(({ userId }) => userId)
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

function readActiveLessonSnapshots(database: WritingAppDatabase): {
  readonly courseId: AdminLessonAnalyticsItemDto["courseId"]
  readonly courseTitle: string
  readonly lessonId: AdminLessonAnalyticsItemDto["lessonId"]
  readonly lessonTitle: string
}[] {
  return database
    .select({
      courseId: courses.id,
      courseTitle: courseCurriculumVersions.title,
      lessonId: lessonVersions.id,
      lessonTitle: lessonVersions.title,
    })
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
    .all()
    .map((row) => ({
      ...row,
      courseId: courseIdSchema.parse(row.courseId),
      lessonId: lessonIdSchema.parse(row.lessonId),
    }))
}

function countByDate(
  dates: readonly LearningDateKey[]
): Map<LearningDateKey, number> {
  const counts = new Map<LearningDateKey, number>()

  for (const date of dates) {
    counts.set(date, (counts.get(date) ?? 0) + 1)
  }

  return counts
}

function createLessonAnalyticsComparator(
  sort: AdminLessonAnalyticsSort,
  direction: AdminSortDirection
) {
  const factor = direction === "asc" ? 1 : -1

  return (
    left: AdminLessonAnalyticsSnapshot,
    right: AdminLessonAnalyticsSnapshot
  ): number => {
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

function compareWorstLessons(
  left: AdminLessonAnalyticsSnapshot,
  right: AdminLessonAnalyticsSnapshot
): number {
  return (
    left.completionRate - right.completionRate ||
    right.dropOffRate - left.dropOffRate ||
    left.lessonTitle.localeCompare(right.lessonTitle)
  )
}
