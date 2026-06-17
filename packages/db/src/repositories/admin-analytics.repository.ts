import type {
  AdminAnalyticsDto,
  AdminLessonAnalyticsPageDto,
  AdminLessonAnalyticsSort,
  AdminRepository,
  AdminSortDirection,
  AdminUserStatus,
  ReadAdminAnalyticsInput,
  ReadAdminLessonAnalyticsInput,
} from "@workspace/core/admin"
import {
  contentStatuses,
  learnerAccountStatuses,
  lessonProgressStatuses,
} from "@workspace/core/status"
import { and, asc, countDistinct, desc, eq, or, sql } from "drizzle-orm"

import type { KwepDatabase } from "@workspace/db/client"
import {
  addLearningCalendarDays,
  toLearningDateKey,
} from "@workspace/db/repositories/activity-date"
import {
  calculateCurrentStreakDays,
  createPageBounds,
  groupActivityDatesByUserId,
} from "@workspace/db/repositories/admin-repository-shared"
import {
  authUsers,
  courses,
  courseUnits,
  learnerActivityDays,
  learnerLessonProgress,
  learnerProfiles,
  lessons,
} from "@workspace/db/schema"

type AdminAnalyticsRepository = Pick<
  AdminRepository,
  "readAnalytics" | "readLessonAnalytics"
>

export function createAdminAnalyticsRepository(
  db: KwepDatabase
): AdminAnalyticsRepository {
  return {
    readAnalytics(input) {
      return Promise.resolve(readAnalytics(db, input))
    },
    readLessonAnalytics(input) {
      return Promise.resolve(readLessonAnalytics(db, input))
    },
  }
}

type AdminLearnerSnapshot = {
  readonly createdAt: Date
  readonly id: string
  readonly status: AdminUserStatus | null
}

type AdminLessonAnalyticsSnapshot = {
  readonly completed: number
  readonly completionRate: number
  readonly courseId: string
  readonly courseTitle: string
  readonly dropOffRate: number
  readonly lessonId: string
  readonly lessonTitle: string
  readonly started: number
}

const streakBucketRanges = [
  { label: "0일", max: 0, min: 0 },
  { label: "1-3일", max: 3, min: 1 },
  { label: "4-7일", max: 7, min: 4 },
  { label: "8-14일", max: 14, min: 8 },
  { label: "15일+", max: Number.POSITIVE_INFINITY, min: 15 },
] as const

function readAnalytics(
  db: KwepDatabase,
  input: ReadAdminAnalyticsInput
): AdminAnalyticsDto {
  const lessonAnalytics = createLessonAnalyticsSnapshots(db)

  return {
    dailySeries: createDailySeries(db, input),
    streakBuckets: createStreakBuckets(db),
    worstLessons: [...lessonAnalytics].sort(compareWorstLessons).slice(0, 8),
  }
}

function readLessonAnalytics(
  db: KwepDatabase,
  input: ReadAdminLessonAnalyticsInput
): AdminLessonAnalyticsPageDto {
  const query = input.query.trim().toLowerCase()
  const startedExpression = createLessonAnalyticsStartedExpression()
  const completedExpression = createLessonAnalyticsCompletedExpression()
  const completionRateExpression =
    createLessonAnalyticsCompletionRateExpression({
      completed: completedExpression,
      started: startedExpression,
    })
  const dropOffRateExpression = sql<number>`100 - ${completionRateExpression}`
  const whereCondition = createReadLessonAnalyticsWhereCondition(query)
  const totalItems =
    db
      .select({ value: countDistinct(lessons.id) })
      .from(lessons)
      .innerJoin(courses, eq(courses.id, lessons.courseId))
      .innerJoin(courseUnits, eq(courseUnits.id, lessons.unitId))
      .where(whereCondition)
      .get()?.value ?? 0
  const pagination = createPageBounds(input, totalItems)
  const rows = db
    .select({
      completed: completedExpression,
      completionRate: completionRateExpression,
      courseId: courses.id,
      courseTitle: courses.title,
      dropOffRate: dropOffRateExpression,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      started: startedExpression,
    })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .innerJoin(courseUnits, eq(courseUnits.id, lessons.unitId))
    .leftJoin(
      learnerLessonProgress,
      eq(learnerLessonProgress.lessonId, lessons.id)
    )
    .leftJoin(authUsers, eq(authUsers.id, learnerLessonProgress.userId))
    .leftJoin(learnerProfiles, eq(learnerProfiles.userId, authUsers.id))
    .where(whereCondition)
    .groupBy(lessons.id, lessons.title, courses.id, courses.title)
    .orderBy(
      ...createReadLessonAnalyticsOrder(input.sort, input.direction, {
        completionRate: completionRateExpression,
        courseTitle: courses.title,
        dropOffRate: dropOffRateExpression,
        lessonTitle: lessons.title,
      })
    )
    .limit(pagination.pageSize)
    .offset(pagination.offset)
    .all()

  return {
    items: rows,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
    },
  }
}

function createReadLessonAnalyticsWhereCondition(query: string) {
  const queryCondition =
    query.length === 0
      ? undefined
      : or(
          sql`lower(${lessons.title}) like ${`%${query}%`}`,
          sql`lower(${courses.title}) like ${`%${query}%`}`
        )

  return and(
    eq(lessons.status, contentStatuses.active),
    eq(courses.status, contentStatuses.active),
    eq(courseUnits.status, contentStatuses.active),
    queryCondition
  )
}

function createLessonAnalyticsStartedExpression() {
  return sql<number>`count(distinct case when ${authUsers.id} is not null and (${learnerProfiles.status} is null or ${learnerProfiles.status} <> ${learnerAccountStatuses.deleted}) then ${learnerLessonProgress.userId} end)`
}

function createLessonAnalyticsCompletedExpression() {
  return sql<number>`count(distinct case when ${authUsers.id} is not null and (${learnerProfiles.status} is null or ${learnerProfiles.status} <> ${learnerAccountStatuses.deleted}) and ${learnerLessonProgress.status} = ${lessonProgressStatuses.completed} then ${learnerLessonProgress.userId} end)`
}

function createLessonAnalyticsCompletionRateExpression({
  completed,
  started,
}: {
  readonly completed: ReturnType<typeof sql<number>>
  readonly started: ReturnType<typeof sql<number>>
}) {
  return sql<number>`case when ${started} = 0 then 0 else round((${completed} * 100.0) / ${started}) end`
}

function createReadLessonAnalyticsOrder(
  sort: AdminLessonAnalyticsSort,
  direction: AdminSortDirection,
  expressions: {
    readonly completionRate: ReturnType<typeof sql<number>>
    readonly courseTitle: typeof courses.title
    readonly dropOffRate: ReturnType<typeof sql<number>>
    readonly lessonTitle: typeof lessons.title
  }
) {
  const applyDirection = direction === "asc" ? asc : desc

  switch (sort) {
    case "course":
      return [
        applyDirection(expressions.courseTitle),
        asc(expressions.lessonTitle),
      ] as const
    case "completionRate":
      return [
        applyDirection(expressions.completionRate),
        asc(expressions.lessonTitle),
      ] as const
    case "dropOff":
      return [
        applyDirection(expressions.dropOffRate),
        asc(expressions.lessonTitle),
      ] as const
    case "lesson":
      return [applyDirection(expressions.lessonTitle)] as const
  }
}

function createDailySeries(
  db: KwepDatabase,
  input: ReadAdminAnalyticsInput
): AdminAnalyticsDto["dailySeries"] {
  const learnerIds = new Set(readActiveLearners(db).map((user) => user.id))
  const signupsByDate = countByDate(
    readActiveLearners(db).map((user) => toLearningDateKey(user.createdAt))
  )
  const completionsByDate = countByDate(
    db
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
  db: KwepDatabase
): AdminAnalyticsDto["streakBuckets"] {
  const activitiesByUserId = groupActivityDatesByUserId(
    db.select().from(learnerActivityDays).all()
  )
  const counts = new Map(streakBucketRanges.map((bucket) => [bucket.label, 0]))

  for (const user of readActiveLearners(db)) {
    const streak = calculateCurrentStreakDays(
      activitiesByUserId.get(user.id) ?? []
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
  db: KwepDatabase
): AdminLessonAnalyticsSnapshot[] {
  const learnerIds = new Set(readActiveLearners(db).map((user) => user.id))
  const progressRows = db
    .select()
    .from(learnerLessonProgress)
    .all()
    .filter((progress) => learnerIds.has(progress.userId))

  return readActiveLessonSnapshots(db).map((lesson) => {
    const lessonProgressRows = progressRows.filter(
      (progress) => progress.lessonId === lesson.lessonId
    )
    const started = lessonProgressRows.length
    const completed = lessonProgressRows.filter(
      (progress) => progress.status === lessonProgressStatuses.completed
    ).length
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

function readActiveLearners(db: KwepDatabase): AdminLearnerSnapshot[] {
  return db
    .select({
      createdAt: authUsers.createdAt,
      id: authUsers.id,
      status: learnerProfiles.status,
    })
    .from(authUsers)
    .leftJoin(learnerProfiles, eq(learnerProfiles.userId, authUsers.id))
    .all()
    .filter((user) => user.status !== learnerAccountStatuses.deleted)
}

function readActiveLessonSnapshots(db: KwepDatabase): {
  readonly courseId: string
  readonly courseTitle: string
  readonly lessonId: string
  readonly lessonTitle: string
}[] {
  const activeCourses = db
    .select()
    .from(courses)
    .all()
    .filter((course) => course.status === contentStatuses.active)
  const activeCourseById = new Map(
    activeCourses.map((course) => [course.id, course])
  )
  const activeUnitIds = new Set(
    db
      .select()
      .from(courseUnits)
      .all()
      .filter(
        (unit) =>
          unit.status === contentStatuses.active &&
          activeCourseById.has(unit.courseId)
      )
      .map((unit) => unit.id)
  )

  return db
    .select()
    .from(lessons)
    .all()
    .filter(
      (lesson) =>
        lesson.status === contentStatuses.active &&
        activeCourseById.has(lesson.courseId) &&
        activeUnitIds.has(lesson.unitId)
    )
    .map((lesson) => ({
      courseId: lesson.courseId,
      courseTitle: activeCourseById.get(lesson.courseId)?.title ?? "",
      lessonId: lesson.id,
      lessonTitle: lesson.title,
    }))
}

function countByDate(dates: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>()

  for (const date of dates) {
    counts.set(date, (counts.get(date) ?? 0) + 1)
  }

  return counts
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
