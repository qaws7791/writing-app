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

import type { KwepDatabase } from "@workspace/db/client"
import {
  addLearningCalendarDays,
  toLearningDateKey,
} from "@workspace/db/repositories/activity-date"
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

export function createDrizzleAdminRepository(
  db: KwepDatabase
): AdminRepository {
  return {
    archiveCourse(input) {
      return Promise.resolve(archiveCourse(db, input))
    },
    createCourse(input) {
      return Promise.resolve(createCourse(db, input))
    },
    deleteUser(input) {
      return Promise.resolve(deleteUser(db, input))
    },
    readAnalytics(input) {
      return Promise.resolve(readAnalytics(db, input))
    },
    readDashboard(input) {
      return Promise.resolve(readDashboard(db, input))
    },
    readLessonAnalytics(input) {
      return Promise.resolve(readLessonAnalytics(db, input))
    },
    readCourseEditor(input) {
      return Promise.resolve(readCourseEditor(db, input))
    },
    readCourses(input) {
      return Promise.resolve(readCourses(db, input))
    },
    readSettings() {
      return Promise.resolve(readSettings(db))
    },
    readUser(input) {
      return Promise.resolve(readUser(db, input))
    },
    readUsers(input) {
      return Promise.resolve(readUsers(db, input))
    },
    resetContent(input) {
      return resetContent(db, input)
    },
    saveLegalSettings(input) {
      return Promise.resolve(saveLegalSettings(db, input))
    },
    saveNoticeSettings(input) {
      return Promise.resolve(saveNoticeSettings(db, input))
    },
    updateUserStatus(input) {
      return Promise.resolve(updateUserStatus(db, input))
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
  const filteredLessons = createLessonAnalyticsSnapshots(db)
    .filter(
      (lesson) =>
        query.length === 0 ||
        lesson.lessonTitle.toLowerCase().includes(query) ||
        lesson.courseTitle.toLowerCase().includes(query)
    )
    .sort((left, right) =>
      compareLessonAnalytics(left, right, input.sort, input.direction)
    )
  const totalItems = filteredLessons.length
  const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize))
  const page = Math.min(Math.max(1, input.page), totalPages)
  const start = (page - 1) * input.pageSize

  return {
    items: filteredLessons.slice(start, start + input.pageSize),
    pagination: {
      page,
      pageSize: input.pageSize,
      totalItems,
      totalPages,
    },
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

function compareLessonAnalytics(
  left: AdminLessonAnalyticsSnapshot,
  right: AdminLessonAnalyticsSnapshot,
  sort: AdminLessonAnalyticsSort,
  direction: AdminSortDirection
): number {
  const byLesson = left.lessonTitle.localeCompare(right.lessonTitle)
  let result = 0

  switch (sort) {
    case "course":
      result = left.courseTitle.localeCompare(right.courseTitle)
      break
    case "completionRate":
      result = left.completionRate - right.completionRate
      break
    case "dropOff":
      result = left.dropOffRate - right.dropOffRate
      break
    case "lesson":
      result = byLesson
      break
  }

  return (direction === "asc" ? result : -result) || byLesson
}

function createCourse(
  db: KwepDatabase,
  input: CreateAdminCourseInput
): AdminCourseDetailDto {
  const courseId = `c${input.now.getTime().toString(36)}`
  const unitId = `${courseId}-u1`
  const lessonId = `${courseId}-l1`
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
          id: `${lessonId}-s1`,
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
          id: `${lessonId}-s2`,
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
    .all()
    .filter(
      (unit) =>
        unit.courseId === input.courseId &&
        unit.status === contentStatuses.active
    )
    .sort((left, right) => left.sortOrder - right.sortOrder)
  const lessonRows = db
    .select()
    .from(lessons)
    .all()
    .filter(
      (lesson) =>
        lesson.courseId === input.courseId &&
        lesson.status === contentStatuses.active
    )
    .sort((left, right) => left.sortOrder - right.sortOrder)
  const stepRows = db
    .select()
    .from(lessonSteps)
    .all()
    .filter((step) => step.status === contentStatuses.active)
    .sort((left, right) => left.sortOrder - right.sortOrder)

  return {
    category: course.category,
    description: course.description,
    id: course.id,
    revision: course.curriculumRevision,
    status: course.status,
    title: course.title,
    units: unitRows.map((unit) => ({
      id: unit.id,
      lessons: lessonRows
        .filter((lesson) => lesson.unitId === unit.id)
        .map((lesson) => ({
          category: lesson.category,
          description: lesson.description,
          estimatedMinutes: lesson.estimatedMinutes,
          id: lesson.id,
          sortOrder: lesson.sortOrder,
          status: lesson.status,
          summary: readJsonStringArray(lesson.summaryJson),
          steps: stepRows
            .filter((step) => step.lessonId === lesson.id)
            .map((step) => ({
              contentJson: step.contentJson,
              id: step.id,
              sortOrder: step.sortOrder,
              status: step.status,
              type: step.type,
            })),
          title: lesson.title,
        })),
      sortOrder: unit.sortOrder,
      status: unit.status,
      title: unit.title,
    })),
  }
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
  const unitRows = db.select().from(courseUnits).all()
  const lessonRows = db.select().from(lessons).all()
  const filteredCourses = db
    .select()
    .from(courses)
    .all()
    .filter((course) =>
      input.status === "all" ? true : course.status === input.status
    )
    .filter((course) => category.length === 0 || course.category === category)
    .filter(
      (course) =>
        query.length === 0 ||
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)
    )
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((course) => {
      const activeUnitIds = unitRows
        .filter(
          (unit) =>
            unit.courseId === course.id &&
            unit.status === contentStatuses.active
        )
        .map((unit) => unit.id)
      const activeUnitIdSet = new Set(activeUnitIds)

      return {
        category: course.category,
        id: course.id,
        lessonCount: lessonRows.filter(
          (lesson) =>
            lesson.courseId === course.id &&
            lesson.status === contentStatuses.active &&
            activeUnitIdSet.has(lesson.unitId)
        ).length,
        revision: course.curriculumRevision,
        status: course.status,
        title: course.title,
        unitCount: activeUnitIds.length,
      }
    })
  const totalItems = filteredCourses.length
  const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize))
  const page = Math.min(Math.max(1, input.page), totalPages)
  const start = (page - 1) * input.pageSize

  return {
    items: filteredCourses.slice(start, start + input.pageSize),
    pagination: {
      page,
      pageSize: input.pageSize,
      totalItems,
      totalPages,
    },
  }
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

    const archived = archiveContentOutsideSeed(transaction, seedRows)

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
  const revisions = db
    .select()
    .from(courses)
    .all()
    .map((course) => course.curriculumRevision)

  return Math.max(0, ...revisions) + 1
}

function archiveContentOutsideSeed(
  db: KwepDatabase,
  seedRows: Awaited<ReturnType<typeof createDefaultContentSeedRows>>
): number {
  let archived = 0
  const seedCourseIds = new Set(seedRows.courses.map((course) => course.id))
  const seedUnitIds = new Set(seedRows.units.map((unit) => unit.id))
  const seedLessonIds = new Set(seedRows.lessons.map((lesson) => lesson.id))
  const seedStepIds = new Set(seedRows.steps.map((step) => step.id))

  for (const course of db.select().from(courses).all()) {
    if (
      !seedCourseIds.has(course.id) &&
      course.status !== contentStatuses.archived
    ) {
      db.update(courses)
        .set({ status: contentStatuses.archived })
        .where(eq(courses.id, course.id))
        .run()
      archived += 1
    }
  }
  for (const unit of db.select().from(courseUnits).all()) {
    if (!seedUnitIds.has(unit.id) && unit.status !== contentStatuses.archived) {
      db.update(courseUnits)
        .set({ status: contentStatuses.archived })
        .where(eq(courseUnits.id, unit.id))
        .run()
      archived += 1
    }
  }
  for (const lesson of db.select().from(lessons).all()) {
    if (
      !seedLessonIds.has(lesson.id) &&
      lesson.status !== contentStatuses.archived
    ) {
      db.update(lessons)
        .set({ status: contentStatuses.archived })
        .where(eq(lessons.id, lesson.id))
        .run()
      archived += 1
    }
  }
  for (const step of db.select().from(lessonSteps).all()) {
    if (!seedStepIds.has(step.id) && step.status !== contentStatuses.archived) {
      db.update(lessonSteps)
        .set({ status: contentStatuses.archived })
        .where(eq(lessonSteps.id, step.id))
        .run()
      archived += 1
    }
  }

  return archived
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
