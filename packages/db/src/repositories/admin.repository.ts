import type {
  AdminAnalyticsDto,
  AdminArchiveCourseResultDto,
  AdminContentResetResultDto,
  AdminCourseDetailDto,
  AdminCourseListDto,
  AdminDashboardDto,
  AdminDeleteUserResultDto,
  AdminSettingsDto,
  AdminLessonAnalyticsPageDto,
  AdminLessonAnalyticsSort,
  AdminRepository,
  AdminSortDirection,
  ResetAdminContentInput,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUserSort,
  AdminUserStatus,
  ArchiveAdminCourseInput,
  CreateAdminCourseInput,
  DeleteAdminUserInput,
  ReadAdminAnalyticsInput,
  ReadAdminCourseInput,
  ReadAdminCoursesInput,
  ReadAdminDashboardInput,
  ReadAdminLessonAnalyticsInput,
  ReadAdminUserInput,
  ReadAdminUsersInput,
  SaveAdminLegalSettingsInput,
  SaveAdminNoticeSettingsInput,
  UpdateAdminUserStatusInput,
} from "@workspace/core/admin"
import {
  contentStatuses,
  learnerAccountStatuses,
  lessonProgressStatuses,
} from "@workspace/core/status"
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm"

import { archiveContentRowsOutsideSeed } from "@workspace/db/content/content-archive-policy"
import type { KwepDatabase } from "@workspace/db/client"
import {
  addLearningCalendarDays,
  toLearningDateKey,
} from "@workspace/db/repositories/activity-date"
import {
  createDefaultAdminCourseContentIds,
  type CreateAdminCourseContentIds,
  type NewAdminCourseContentIds,
} from "@workspace/db/repositories/admin-content-ids"
import { createDefaultContentSeedRows } from "@workspace/db/seeds/seed-content"
import {
  adminSettings,
  authUsers,
  courses,
  courseUnits,
  learnerActivityDays,
  learnerLessonProgress,
  learnerProfiles,
  lessonSteps,
  lessons,
} from "@workspace/db/schema"

const recentActivityLimit = 5
const createCourseCollisionRetryLimit = 3
type LessonRow = typeof lessons.$inferSelect
type LessonStepRow = typeof lessonSteps.$inferSelect
type AdminCourseRepository = Pick<
  AdminRepository,
  | "archiveCourse"
  | "createCourse"
  | "readCourseEditor"
  | "readCourses"
  | "resetContent"
>
type AdminUserRepository = Pick<
  AdminRepository,
  "deleteUser" | "readUser" | "readUsers" | "updateUserStatus"
>
type AdminAnalyticsRepository = Pick<
  AdminRepository,
  "readAnalytics" | "readDashboard" | "readLessonAnalytics"
>
type AdminSettingsRepository = Pick<
  AdminRepository,
  "readSettings" | "saveLegalSettings" | "saveNoticeSettings"
>
type PageInput = {
  readonly page: number
  readonly pageSize: number
}
type PageBounds = {
  readonly offset: number
  readonly page: number
  readonly pageSize: number
  readonly totalItems: number
  readonly totalPages: number
}

export type DrizzleAdminRepositoryDependencies = {
  readonly createCourseContentIds?: CreateAdminCourseContentIds
}

type ResolvedDrizzleAdminRepositoryDependencies = {
  readonly createCourseContentIds: CreateAdminCourseContentIds
}

export function createDrizzleAdminRepository(
  db: KwepDatabase,
  dependencies: DrizzleAdminRepositoryDependencies = {}
): AdminRepository {
  const resolvedDependencies =
    resolveDrizzleAdminRepositoryDependencies(dependencies)

  return {
    ...createAdminCourseRepository(db, resolvedDependencies),
    ...createAdminUserRepository(db),
    ...createAdminAnalyticsRepository(db),
    ...createAdminSettingsRepository(db),
  }
}

function resolveDrizzleAdminRepositoryDependencies(
  dependencies: DrizzleAdminRepositoryDependencies
): ResolvedDrizzleAdminRepositoryDependencies {
  return {
    createCourseContentIds:
      dependencies.createCourseContentIds ?? createDefaultAdminCourseContentIds,
  }
}

function createPageBounds(input: PageInput, totalItems: number): PageBounds {
  const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize))
  const page = Math.min(Math.max(1, input.page), totalPages)

  return {
    offset: (page - 1) * input.pageSize,
    page,
    pageSize: input.pageSize,
    totalItems,
    totalPages,
  }
}

function createAdminCourseRepository(
  db: KwepDatabase,
  dependencies: ResolvedDrizzleAdminRepositoryDependencies
): AdminCourseRepository {
  return {
    archiveCourse(input) {
      return Promise.resolve(archiveCourse(db, input))
    },
    createCourse(input) {
      return Promise.resolve(
        createCourse(db, input, dependencies.createCourseContentIds)
      )
    },
    readCourseEditor(input) {
      return Promise.resolve(readCourseEditor(db, input))
    },
    readCourses(input) {
      return Promise.resolve(readCourses(db, input))
    },
    resetContent(input) {
      return resetContent(db, input)
    },
  }
}

function createAdminUserRepository(db: KwepDatabase): AdminUserRepository {
  return {
    deleteUser(input) {
      return Promise.resolve(deleteUser(db, input))
    },
    readUser(input) {
      return Promise.resolve(readUser(db, input))
    },
    readUsers(input) {
      return Promise.resolve(readUsers(db, input))
    },
    updateUserStatus(input) {
      return Promise.resolve(updateUserStatus(db, input))
    },
  }
}

function createAdminAnalyticsRepository(
  db: KwepDatabase
): AdminAnalyticsRepository {
  return {
    readAnalytics(input) {
      return Promise.resolve(readAnalytics(db, input))
    },
    readDashboard(input) {
      return Promise.resolve(readDashboard(db, input))
    },
    readLessonAnalytics(input) {
      return Promise.resolve(readLessonAnalytics(db, input))
    },
  }
}

function createAdminSettingsRepository(
  db: KwepDatabase
): AdminSettingsRepository {
  return {
    readSettings() {
      return Promise.resolve(readSettings(db))
    },
    saveLegalSettings(input) {
      return Promise.resolve(saveLegalSettings(db, input))
    },
    saveNoticeSettings(input) {
      return Promise.resolve(saveNoticeSettings(db, input))
    },
  }
}

function readDashboard(
  db: KwepDatabase,
  input: ReadAdminDashboardInput
): AdminDashboardDto {
  const todayKey = toLearningDateKey(input.now)
  const last7DaysStart = addLearningCalendarDays(todayKey, -6)
  const todayStart = new Date(`${todayKey}T00:00:00.000Z`)
  const tomorrowStart = new Date(
    `${addLearningCalendarDays(todayKey, 1)}T00:00:00.000Z`
  )

  return {
    metrics: {
      activeCourses: readActiveCourseCount(db),
      activeLessons: readActiveLessonCount(db),
      activeUsersLast7Days: readActiveUsersLast7DaysCount(db, {
        last7DaysStart,
        todayKey,
      }),
      completedLessons: readCompletedLessonCount(db),
      signupsLast7Days: readSignupCount(
        db,
        new Date(`${last7DaysStart}T00:00:00.000Z`)
      ),
      signupsToday: readSignupCount(db, todayStart, tomorrowStart),
      totalUsers: readLearnerCount(db),
    },
    recentActivities: readRecentActivities(db),
  }
}

function readActiveCourseCount(db: KwepDatabase): number {
  return (
    db
      .select({ value: count() })
      .from(courses)
      .where(eq(courses.status, contentStatuses.active))
      .get()?.value ?? 0
  )
}

function readActiveLessonCount(db: KwepDatabase): number {
  return (
    db
      .select({ value: count() })
      .from(lessons)
      .innerJoin(courses, eq(courses.id, lessons.courseId))
      .innerJoin(courseUnits, eq(courseUnits.id, lessons.unitId))
      .where(
        and(
          eq(lessons.status, contentStatuses.active),
          eq(courses.status, contentStatuses.active),
          eq(courseUnits.status, contentStatuses.active)
        )
      )
      .get()?.value ?? 0
  )
}

function readActiveUsersLast7DaysCount(
  db: KwepDatabase,
  input: {
    readonly last7DaysStart: string
    readonly todayKey: string
  }
): number {
  return (
    db
      .select({ value: countDistinct(learnerActivityDays.userId) })
      .from(learnerActivityDays)
      .innerJoin(authUsers, eq(authUsers.id, learnerActivityDays.userId))
      .leftJoin(learnerProfiles, eq(learnerProfiles.userId, authUsers.id))
      .where(
        and(
          createActiveLearnerCondition(),
          gte(learnerActivityDays.activityDate, input.last7DaysStart),
          lte(learnerActivityDays.activityDate, input.todayKey)
        )
      )
      .get()?.value ?? 0
  )
}

function readCompletedLessonCount(db: KwepDatabase): number {
  return (
    db
      .select({ value: count() })
      .from(learnerLessonProgress)
      .innerJoin(authUsers, eq(authUsers.id, learnerLessonProgress.userId))
      .leftJoin(learnerProfiles, eq(learnerProfiles.userId, authUsers.id))
      .where(
        and(
          createActiveLearnerCondition(),
          eq(learnerLessonProgress.status, lessonProgressStatuses.completed)
        )
      )
      .get()?.value ?? 0
  )
}

function readSignupCount(db: KwepDatabase, start: Date, end?: Date): number {
  return (
    db
      .select({ value: count() })
      .from(authUsers)
      .leftJoin(learnerProfiles, eq(learnerProfiles.userId, authUsers.id))
      .where(
        and(
          createActiveLearnerCondition(),
          gte(authUsers.createdAt, start),
          end === undefined ? undefined : lt(authUsers.createdAt, end)
        )
      )
      .get()?.value ?? 0
  )
}

function readLearnerCount(db: KwepDatabase): number {
  return (
    db
      .select({ value: count() })
      .from(authUsers)
      .leftJoin(learnerProfiles, eq(learnerProfiles.userId, authUsers.id))
      .where(createActiveLearnerCondition())
      .get()?.value ?? 0
  )
}

function readRecentActivities(
  db: KwepDatabase
): AdminDashboardDto["recentActivities"] {
  const nameExpression = sql<string>`coalesce(${learnerProfiles.displayName}, ${authUsers.name})`
  const lastActiveExpression = sql<string>`max(${learnerActivityDays.activityDate})`
  const rows = db
    .select({
      email: authUsers.email,
      id: authUsers.id,
      lastActiveDate: lastActiveExpression,
      name: nameExpression,
    })
    .from(authUsers)
    .innerJoin(
      learnerActivityDays,
      eq(learnerActivityDays.userId, authUsers.id)
    )
    .leftJoin(learnerProfiles, eq(learnerProfiles.userId, authUsers.id))
    .where(createActiveLearnerCondition())
    .groupBy(
      authUsers.id,
      authUsers.email,
      authUsers.name,
      learnerProfiles.displayName
    )
    .orderBy(desc(lastActiveExpression), asc(nameExpression))
    .limit(recentActivityLimit)
    .all()
  const activityDatesByUserId =
    rows.length === 0
      ? new Map<string, string[]>()
      : groupActivityDatesByUserId(
          db
            .select()
            .from(learnerActivityDays)
            .where(
              inArray(
                learnerActivityDays.userId,
                rows.map((user) => user.id)
              )
            )
            .all()
        )

  return rows.map((user) => ({
    currentStreakDays: calculateCurrentStreakDays(
      activityDatesByUserId.get(user.id) ?? []
    ),
    email: user.email,
    lastActiveDate: user.lastActiveDate,
    name: user.name,
    userId: user.id,
  }))
}

function createActiveLearnerCondition() {
  return or(
    isNull(learnerProfiles.status),
    ne(learnerProfiles.status, learnerAccountStatuses.deleted)
  )
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

function createCourse(
  db: KwepDatabase,
  input: CreateAdminCourseInput,
  createContentIds: CreateAdminCourseContentIds
): AdminCourseDetailDto {
  for (let attempt = 1; attempt <= createCourseCollisionRetryLimit; attempt++) {
    const contentIds = createContentIds()

    try {
      return insertCourseAggregate(db, input, contentIds)
    } catch (error) {
      if (
        attempt === createCourseCollisionRetryLimit ||
        !isContentIdCollision(error)
      ) {
        throw error
      }
    }
  }

  throw new Error("Course content ID generation retry limit was exceeded")
}

function insertCourseAggregate(
  db: KwepDatabase,
  input: CreateAdminCourseInput,
  contentIds: NewAdminCourseContentIds
): AdminCourseDetailDto {
  const { courseId, lessonId, readingStepId, unitId, writeStepId } = contentIds
  const revision = readNextContentRevision(db)
  const sortOrder = readNextCourseSortOrder(db)

  db.transaction((transaction) => {
    transaction
      .insert(courses)
      .values({
        category: "미분류",
        curriculumRevision: revision,
        description: "강의 설명을 입력하세요.",
        id: courseId,
        sortOrder,
        status: contentStatuses.active,
        title: "새 강의",
        visualKey: "basic-sentence-writing",
      })
      .run()
    transaction
      .insert(courseUnits)
      .values({
        courseId,
        id: unitId,
        sortOrder: 1,
        status: contentStatuses.active,
        title: "새 유닛",
      })
      .run()
    transaction
      .insert(lessons)
      .values({
        category: "미분류",
        courseId,
        description: "레슨 설명을 입력하세요.",
        estimatedMinutes: 5,
        id: lessonId,
        sortOrder: 1,
        status: contentStatuses.active,
        summaryJson: "[]",
        title: "새 레슨",
        unitId,
      })
      .run()
    transaction
      .insert(lessonSteps)
      .values([
        {
          contentJson: JSON.stringify({
            body: "본문을 입력하세요.",
            title: "새 읽기 스텝",
            type: "reading",
          }),
          id: readingStepId,
          lessonId,
          sortOrder: 1,
          status: contentStatuses.active,
          type: "READING",
        },
        {
          contentJson: JSON.stringify({
            goal: 150,
            max: 500,
            min: 50,
            prompt: "주제를 입력하세요.",
            title: "글쓰기",
            type: "write",
          }),
          id: writeStepId,
          lessonId,
          sortOrder: 2,
          status: contentStatuses.active,
          type: "WRITE",
        },
      ])
      .run()
  })

  const created = readCourseEditor(db, { courseId })

  if (created === null) {
    throw new Error("Created course editor document was not found")
  }

  return created
}

function isContentIdCollision(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes("UNIQUE constraint failed") &&
    ["courses.id", "course_units.id", "lessons.id", "lesson_steps.id"].some(
      (column) => error.message.includes(column)
    )
  )
}

function readCourseEditor(
  db: KwepDatabase,
  input: ReadAdminCourseInput
): AdminCourseDetailDto | null {
  const course = db
    .select()
    .from(courses)
    .where(eq(courses.id, input.courseId))
    .get()

  if (course === undefined || course.status !== contentStatuses.active) {
    return null
  }

  const unitRows = db
    .select()
    .from(courseUnits)
    .where(
      and(
        eq(courseUnits.courseId, input.courseId),
        eq(courseUnits.status, contentStatuses.active)
      )
    )
    .orderBy(asc(courseUnits.sortOrder))
    .all()
  const unitIds = unitRows.map((unit) => unit.id)
  const lessonRows =
    unitIds.length === 0
      ? []
      : db
          .select()
          .from(lessons)
          .where(
            and(
              eq(lessons.courseId, input.courseId),
              eq(lessons.status, contentStatuses.active),
              inArray(lessons.unitId, unitIds)
            )
          )
          .orderBy(asc(lessons.sortOrder))
          .all()
  const lessonIds = lessonRows.map((lesson) => lesson.id)
  const stepRows =
    lessonIds.length === 0
      ? []
      : db
          .select()
          .from(lessonSteps)
          .where(
            and(
              eq(lessonSteps.status, contentStatuses.active),
              inArray(lessonSteps.lessonId, lessonIds)
            )
          )
          .orderBy(asc(lessonSteps.sortOrder))
          .all()
  const lessonsByUnitId = groupLessonsByUnitId(lessonRows)
  const stepsByLessonId = groupStepsByLessonId(stepRows)

  return {
    category: course.category,
    description: course.description,
    id: course.id,
    revision: course.curriculumRevision,
    status: course.status,
    title: course.title,
    units: unitRows.map((unit) => ({
      id: unit.id,
      lessons:
        lessonsByUnitId.get(unit.id)?.map((lesson) => ({
          category: lesson.category,
          description: lesson.description,
          estimatedMinutes: lesson.estimatedMinutes,
          id: lesson.id,
          sortOrder: lesson.sortOrder,
          status: lesson.status,
          summary: readJsonStringArray(lesson.summaryJson),
          steps:
            stepsByLessonId.get(lesson.id)?.map((step) => ({
              contentJson: step.contentJson,
              id: step.id,
              sortOrder: step.sortOrder,
              status: step.status,
              type: step.type,
            })) ?? [],
          title: lesson.title,
        })) ?? [],
      sortOrder: unit.sortOrder,
      status: unit.status,
      title: unit.title,
    })),
  }
}

function groupLessonsByUnitId(
  lessonRows: readonly LessonRow[]
): Map<string, LessonRow[]> {
  const lessonsByUnitId = new Map<string, LessonRow[]>()

  for (const lesson of lessonRows) {
    const current = lessonsByUnitId.get(lesson.unitId) ?? []

    current.push(lesson)
    lessonsByUnitId.set(lesson.unitId, current)
  }

  return lessonsByUnitId
}

function groupStepsByLessonId(
  stepRows: readonly LessonStepRow[]
): Map<string, LessonStepRow[]> {
  const stepsByLessonId = new Map<string, LessonStepRow[]>()

  for (const step of stepRows) {
    const current = stepsByLessonId.get(step.lessonId) ?? []

    current.push(step)
    stepsByLessonId.set(step.lessonId, current)
  }

  return stepsByLessonId
}

function readJsonStringArray(value: string): string[] {
  const parsed: unknown = JSON.parse(value)

  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : []
}

function readCourses(
  db: KwepDatabase,
  input: ReadAdminCoursesInput
): AdminCourseListDto {
  const query = input.query.trim().toLowerCase()
  const category = input.category.trim()
  const activeUnitCountExpression = sql<number>`count(distinct case when ${courseUnits.status} = ${contentStatuses.active} then ${courseUnits.id} end)`
  const activeLessonCountExpression = sql<number>`count(distinct case when ${courseUnits.status} = ${contentStatuses.active} and ${lessons.status} = ${contentStatuses.active} then ${lessons.id} end)`
  const whereCondition = createReadCoursesWhereCondition({
    category,
    query,
    status: input.status,
  })
  const totalItems =
    db.select({ value: count() }).from(courses).where(whereCondition).get()
      ?.value ?? 0
  const pagination = createPageBounds(input, totalItems)
  const rows = db
    .select({
      category: courses.category,
      id: courses.id,
      lessonCount: activeLessonCountExpression,
      revision: courses.curriculumRevision,
      status: courses.status,
      title: courses.title,
      unitCount: activeUnitCountExpression,
    })
    .from(courses)
    .leftJoin(courseUnits, eq(courseUnits.courseId, courses.id))
    .leftJoin(
      lessons,
      and(eq(lessons.courseId, courses.id), eq(lessons.unitId, courseUnits.id))
    )
    .where(whereCondition)
    .groupBy(
      courses.id,
      courses.category,
      courses.curriculumRevision,
      courses.status,
      courses.title,
      courses.sortOrder
    )
    .orderBy(asc(courses.sortOrder))
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

function createReadCoursesWhereCondition({
  category,
  query,
  status,
}: {
  readonly category: string
  readonly query: string
  readonly status: ReadAdminCoursesInput["status"]
}) {
  const statusCondition =
    status === "all" ? undefined : eq(courses.status, status)
  const categoryCondition =
    category.length === 0 ? undefined : eq(courses.category, category)
  const queryCondition =
    query.length === 0
      ? undefined
      : or(
          sql`lower(${courses.title}) like ${`%${query}%`}`,
          sql`lower(${courses.description}) like ${`%${query}%`}`
        )

  return and(statusCondition, categoryCondition, queryCondition)
}

function archiveCourse(
  db: KwepDatabase,
  input: ArchiveAdminCourseInput
): AdminArchiveCourseResultDto | null {
  const course = db
    .select()
    .from(courses)
    .where(eq(courses.id, input.courseId))
    .get()

  if (course === undefined || course.status === contentStatuses.archived) {
    return null
  }

  void input.now

  db.update(courses)
    .set({
      status: contentStatuses.archived,
    })
    .where(eq(courses.id, input.courseId))
    .run()

  return { archived: true }
}

function readNextCourseSortOrder(db: KwepDatabase): number {
  const sortOrders = db
    .select()
    .from(courses)
    .all()
    .map((course) => course.sortOrder)

  return Math.max(0, ...sortOrders) + 1
}

const settingsKeys = {
  announce: "notice.announce",
  banner: "notice.banner",
  privacy: "legal.privacy",
  terms: "legal.terms",
} as const

function readSettings(db: KwepDatabase): AdminSettingsDto {
  const rows = db.select().from(adminSettings).all()
  const values = new Map(rows.map((row) => [row.key, row.value]))

  return {
    legal: {
      privacy: values.get(settingsKeys.privacy) ?? "",
      terms: values.get(settingsKeys.terms) ?? "",
    },
    notice: {
      announce: values.get(settingsKeys.announce) ?? "",
      banner: values.get(settingsKeys.banner) ?? "",
    },
  }
}

function saveNoticeSettings(
  db: KwepDatabase,
  input: SaveAdminNoticeSettingsInput
): AdminSettingsDto {
  saveSettingRows(db, input.now, [
    [settingsKeys.announce, input.announce],
    [settingsKeys.banner, input.banner],
  ])

  return readSettings(db)
}

function saveLegalSettings(
  db: KwepDatabase,
  input: SaveAdminLegalSettingsInput
): AdminSettingsDto {
  saveSettingRows(db, input.now, [
    [settingsKeys.privacy, input.privacy],
    [settingsKeys.terms, input.terms],
  ])

  return readSettings(db)
}

function saveSettingRows(
  db: KwepDatabase,
  now: Date,
  rows: readonly (readonly [key: string, value: string])[]
): void {
  for (const [key, value] of rows) {
    db.insert(adminSettings)
      .values({
        key,
        updatedAt: now,
        value,
      })
      .onConflictDoUpdate({
        set: {
          updatedAt: now,
          value,
        },
        target: adminSettings.key,
      })
      .run()
  }
}

async function resetContent(
  db: KwepDatabase,
  input: ResetAdminContentInput
): Promise<AdminContentResetResultDto> {
  const seedRows = await createDefaultContentSeedRows()
  const revision = readNextContentRevision(db)

  return db.transaction((transaction) => {
    void input.now

    const archived = archiveContentRowsOutsideSeed(transaction, seedRows)

    for (const course of seedRows.courses) {
      transaction
        .insert(courses)
        .values({
          ...course,
          curriculumRevision: revision,
        })
        .onConflictDoUpdate({
          set: {
            category: course.category,
            curriculumRevision: revision,
            description: course.description,
            sortOrder: course.sortOrder,
            status: contentStatuses.active,
            title: course.title,
          },
          target: courses.id,
        })
        .run()
    }
    for (const unit of seedRows.units) {
      transaction
        .insert(courseUnits)
        .values(unit)
        .onConflictDoUpdate({
          set: {
            courseId: unit.courseId,
            sortOrder: unit.sortOrder,
            status: contentStatuses.active,
            title: unit.title,
          },
          target: courseUnits.id,
        })
        .run()
    }
    for (const lesson of seedRows.lessons) {
      transaction
        .insert(lessons)
        .values(lesson)
        .onConflictDoUpdate({
          set: {
            category: lesson.category,
            courseId: lesson.courseId,
            description: lesson.description,
            estimatedMinutes: lesson.estimatedMinutes,
            sortOrder: lesson.sortOrder,
            status: contentStatuses.active,
            summaryJson: lesson.summaryJson,
            title: lesson.title,
            unitId: lesson.unitId,
          },
          target: lessons.id,
        })
        .run()
    }
    for (const step of seedRows.steps) {
      transaction
        .insert(lessonSteps)
        .values(step)
        .onConflictDoUpdate({
          set: {
            contentJson: step.contentJson,
            lessonId: step.lessonId,
            sortOrder: step.sortOrder,
            status: contentStatuses.active,
            type: step.type,
          },
          target: lessonSteps.id,
        })
        .run()
    }

    return {
      changed: {
        archived,
        courses: seedRows.courses.length,
        lessons: seedRows.lessons.length,
        steps: seedRows.steps.length,
        units: seedRows.units.length,
      },
      revision,
    }
  })
}

function readNextContentRevision(db: KwepDatabase): number {
  const revision =
    db
      .select({
        value: sql<number>`coalesce(max(${courses.curriculumRevision}), 0)`,
      })
      .from(courses)
      .get()?.value ?? 0

  return revision + 1
}

type AdminUserSnapshot = {
  readonly email: string
  readonly id: string
  readonly joined: string
  readonly lastActive: string | null
  readonly lessonsDone: number
  readonly name: string
  readonly status: AdminUserStatus
  readonly streak: number
}

function readUsers(
  db: KwepDatabase,
  input: ReadAdminUsersInput
): AdminUserListDto {
  const query = input.query.trim().toLowerCase()
  const nameExpression = sql<string>`coalesce(${learnerProfiles.displayName}, ${authUsers.name})`
  const statusExpression = sql<AdminUserStatus>`coalesce(${learnerProfiles.status}, ${learnerAccountStatuses.active})`
  const completedLessonsExpression = sql<number>`count(distinct case when ${learnerLessonProgress.status} = ${lessonProgressStatuses.completed} then ${learnerLessonProgress.lessonId} end)`
  const lastActiveExpression = sql<
    string | null
  >`max(${learnerActivityDays.activityDate})`
  const whereCondition = createReadUsersWhereCondition(input.status, query)
  const totalItems =
    db
      .select({ value: count() })
      .from(authUsers)
      .leftJoin(learnerProfiles, eq(learnerProfiles.userId, authUsers.id))
      .where(whereCondition)
      .get()?.value ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize))
  const page = Math.min(Math.max(1, input.page), totalPages)
  const rows = db
    .select({
      email: authUsers.email,
      id: authUsers.id,
      joinedAt: authUsers.createdAt,
      lastActive: lastActiveExpression,
      lessonsDone: completedLessonsExpression,
      name: nameExpression,
      status: statusExpression,
    })
    .from(authUsers)
    .leftJoin(learnerProfiles, eq(learnerProfiles.userId, authUsers.id))
    .leftJoin(
      learnerLessonProgress,
      eq(learnerLessonProgress.userId, authUsers.id)
    )
    .leftJoin(learnerActivityDays, eq(learnerActivityDays.userId, authUsers.id))
    .where(whereCondition)
    .groupBy(
      authUsers.id,
      authUsers.email,
      authUsers.createdAt,
      authUsers.name,
      learnerProfiles.displayName,
      learnerProfiles.status
    )
    .orderBy(
      ...createReadUsersOrder(input.sort, {
        completedLessons: completedLessonsExpression,
        joinedAt: authUsers.createdAt,
        lastActive: lastActiveExpression,
        name: nameExpression,
      })
    )
    .limit(input.pageSize)
    .offset((page - 1) * input.pageSize)
    .all()
  const activityDatesByUserId =
    rows.length === 0
      ? new Map<string, string[]>()
      : groupActivityDatesByUserId(
          db
            .select()
            .from(learnerActivityDays)
            .where(
              inArray(
                learnerActivityDays.userId,
                rows.map((user) => user.id)
              )
            )
            .all()
        )

  return {
    items: rows.map((user) => ({
      email: user.email,
      id: user.id,
      joined: toLearningDateKey(user.joinedAt),
      lastActive: user.lastActive,
      lessonsDone: user.lessonsDone,
      name: user.name,
      status: user.status,
      streak: calculateCurrentStreakDays(
        activityDatesByUserId.get(user.id) ?? []
      ),
    })),
    pagination: {
      page,
      pageSize: input.pageSize,
      totalItems,
      totalPages,
    },
  }
}

function createReadUsersWhereCondition(
  status: ReadAdminUsersInput["status"],
  query: string
) {
  const statusCondition =
    status === "all"
      ? or(
          isNull(learnerProfiles.status),
          ne(learnerProfiles.status, learnerAccountStatuses.deleted)
        )
      : status === learnerAccountStatuses.active
        ? or(isNull(learnerProfiles.status), eq(learnerProfiles.status, status))
        : eq(learnerProfiles.status, status)
  const queryCondition =
    query.length === 0
      ? undefined
      : or(
          sql`lower(coalesce(${learnerProfiles.displayName}, ${authUsers.name})) like ${`%${query}%`}`,
          sql`lower(${authUsers.email}) like ${`%${query}%`}`
        )

  return queryCondition === undefined
    ? statusCondition
    : and(statusCondition, queryCondition)
}

function createReadUsersOrder(
  sort: AdminUserSort,
  expressions: {
    readonly completedLessons: ReturnType<typeof sql<number>>
    readonly joinedAt: typeof authUsers.createdAt
    readonly lastActive: ReturnType<typeof sql<string | null>>
    readonly name: ReturnType<typeof sql<string>>
  }
) {
  switch (sort) {
    case "joined":
      return [desc(expressions.joinedAt), asc(expressions.name)] as const
    case "lastActive":
      return [desc(expressions.lastActive), asc(expressions.name)] as const
    case "lessonsDone":
      return [
        desc(expressions.completedLessons),
        asc(expressions.name),
      ] as const
    case "streak":
      return [desc(expressions.lastActive), asc(expressions.name)] as const
  }
}

function readUser(
  db: KwepDatabase,
  input: ReadAdminUserInput
): AdminUserDetailDto | null {
  const user = readUserSnapshots(db).find((item) => item.id === input.userId)

  if (user === undefined) {
    return null
  }

  const totalLessons = countActiveLessons(db)

  return {
    ...user,
    progressPercent:
      totalLessons === 0
        ? 0
        : Math.round((user.lessonsDone / totalLessons) * 100),
    totalLessons,
  }
}

function updateUserStatus(
  db: KwepDatabase,
  input: UpdateAdminUserStatusInput
): AdminUserDetailDto | null {
  if (readUser(db, input) === null) {
    return null
  }

  db.update(learnerProfiles)
    .set({
      deletedAt: null,
      status: input.status,
    })
    .where(eq(learnerProfiles.userId, input.userId))
    .run()

  return readUser(db, input)
}

function deleteUser(
  db: KwepDatabase,
  input: DeleteAdminUserInput
): AdminDeleteUserResultDto | null {
  if (readUser(db, input) === null) {
    return null
  }

  db.update(learnerProfiles)
    .set({
      deletedAt: input.now,
      status: learnerAccountStatuses.deleted,
    })
    .where(eq(learnerProfiles.userId, input.userId))
    .run()

  return { deleted: true }
}

function readUserSnapshots(db: KwepDatabase): AdminUserSnapshot[] {
  const userRows = db
    .select({
      createdAt: authUsers.createdAt,
      displayName: learnerProfiles.displayName,
      email: authUsers.email,
      id: authUsers.id,
      name: authUsers.name,
      status: learnerProfiles.status,
    })
    .from(authUsers)
    .leftJoin(learnerProfiles, eq(learnerProfiles.userId, authUsers.id))
    .all()
  const activityRows = db.select().from(learnerActivityDays).all()
  const completedLessonRows = db
    .select()
    .from(learnerLessonProgress)
    .all()
    .filter((progress) => progress.status === lessonProgressStatuses.completed)
  const activityDatesByUserId = groupActivityDatesByUserId(activityRows)

  return userRows.map((user) => {
    const activityDates = activityDatesByUserId.get(user.id) ?? []

    return {
      email: user.email,
      id: user.id,
      joined: toLearningDateKey(user.createdAt),
      lastActive: activityDates[0] ?? null,
      lessonsDone: completedLessonRows.filter(
        (progress) => progress.userId === user.id
      ).length,
      name: user.displayName ?? user.name,
      status: user.status ?? learnerAccountStatuses.active,
      streak: calculateCurrentStreakDays(activityDates),
    }
  })
}

function groupActivityDatesByUserId(
  activities: readonly (typeof learnerActivityDays.$inferSelect)[]
): Map<string, string[]> {
  const activityDatesByUserId = new Map<string, string[]>()

  for (const activity of activities) {
    const activityDates = activityDatesByUserId.get(activity.userId) ?? []

    activityDates.push(activity.activityDate)
    activityDates.sort((left, right) => right.localeCompare(left))
    activityDatesByUserId.set(activity.userId, activityDates)
  }

  return activityDatesByUserId
}

function countActiveLessons(db: KwepDatabase): number {
  const activeCourseIds = new Set(
    db
      .select()
      .from(courses)
      .all()
      .filter((course) => course.status === contentStatuses.active)
      .map((course) => course.id)
  )
  const activeUnitIds = new Set(
    db
      .select()
      .from(courseUnits)
      .all()
      .filter(
        (unit) =>
          unit.status === contentStatuses.active &&
          activeCourseIds.has(unit.courseId)
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
        activeCourseIds.has(lesson.courseId) &&
        activeUnitIds.has(lesson.unitId)
    ).length
}

function calculateCurrentStreakDays(activityDates: readonly string[]): number {
  if (activityDates.length === 0) {
    return 0
  }

  const activitySet = new Set(activityDates)
  const latestActivityDate = activityDates[0]
  let streak = 0
  let cursor = latestActivityDate

  while (cursor !== undefined && activitySet.has(cursor)) {
    streak += 1
    cursor = addLearningCalendarDays(cursor, -1)
  }

  return streak
}
