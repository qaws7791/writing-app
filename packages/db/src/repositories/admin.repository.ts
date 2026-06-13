import type {
  AdminAnalyticsDto,
  AdminContentResetResultDto,
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
  DeleteAdminUserInput,
  ReadAdminAnalyticsInput,
  ReadAdminDashboardInput,
  ReadAdminLessonAnalyticsInput,
  ReadAdminUserInput,
  ReadAdminUsersInput,
  SaveAdminLegalSettingsInput,
  SaveAdminNoticeSettingsInput,
  UpdateAdminUserStatusInput,
} from "@workspace/core/admin"
import { eq } from "drizzle-orm"

import type { KwepDatabase } from "@workspace/db/client"
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
  const learnerRows = userRows.filter((user) => user.status !== "deleted")
  const learnerIds = new Set(learnerRows.map((user) => user.id))
  const activityRows = db.select().from(learnerActivityDays).all()
  const courseRows = db.select().from(courses).all()
  const unitRows = db.select().from(courseUnits).all()
  const lessonRows = db.select().from(lessons).all()
  const completedLessonRows = db
    .select()
    .from(learnerLessonProgress)
    .all()
    .filter(
      (progress) =>
        progress.status === "completed" && learnerIds.has(progress.userId)
    )
  const activeCourseIds = new Set(
    courseRows
      .filter((course) => course.status === "active")
      .map((course) => course.id)
  )
  const activeUnitIds = new Set(
    unitRows
      .filter(
        (unit) => unit.status === "active" && activeCourseIds.has(unit.courseId)
      )
      .map((unit) => unit.id)
  )
  const last7DaysStart = toDateKey(addUtcDays(startOfUtcDay(input.now), -6))
  const todayKey = toDateKey(input.now)

  return {
    metrics: {
      activeCourses: activeCourseIds.size,
      activeLessons: lessonRows.filter(
        (lesson) =>
          lesson.status === "active" &&
          activeCourseIds.has(lesson.courseId) &&
          activeUnitIds.has(lesson.unitId)
      ).length,
      activeUsersLast7Days: new Set(
        activityRows
          .filter(
            (activity) =>
              learnerIds.has(activity.userId) &&
              activity.activityDate >= last7DaysStart &&
              activity.activityDate <= todayKey
          )
          .map((activity) => activity.userId)
      ).size,
      completedLessons: completedLessonRows.length,
      signupsLast7Days: learnerRows.filter(
        (user) => toDateKey(user.createdAt) >= last7DaysStart
      ).length,
      signupsToday: learnerRows.filter(
        (user) => toDateKey(user.createdAt) === todayKey
      ).length,
      totalUsers: learnerRows.length,
    },
    recentActivities: createRecentActivities(learnerRows, activityRows),
  }
}

function createRecentActivities(
  users: readonly {
    readonly displayName: string | null
    readonly email: string
    readonly id: string
    readonly name: string
  }[],
  activities: readonly (typeof learnerActivityDays.$inferSelect)[]
): AdminDashboardDto["recentActivities"] {
  const activitiesByUserId = new Map<string, string[]>()

  for (const activity of activities) {
    const userActivities = activitiesByUserId.get(activity.userId) ?? []

    userActivities.push(activity.activityDate)
    activitiesByUserId.set(activity.userId, userActivities)
  }

  return users
    .map((user) => {
      const activityDates = (activitiesByUserId.get(user.id) ?? []).sort(
        (left, right) => right.localeCompare(left)
      )
      const lastActiveDate = activityDates[0] ?? null

      return {
        currentStreakDays: calculateCurrentStreakDays(activityDates),
        email: user.email,
        lastActiveDate,
        name: user.displayName ?? user.name,
        userId: user.id,
      }
    })
    .filter((activity) => activity.lastActiveDate !== null)
    .sort((left, right) =>
      right.lastActiveDate === left.lastActiveDate
        ? left.name.localeCompare(right.name)
        : (right.lastActiveDate ?? "").localeCompare(left.lastActiveDate ?? "")
    )
    .slice(0, recentActivityLimit)
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
    readActiveLearners(db).map((user) => toDateKey(user.createdAt))
  )
  const completionsByDate = countByDate(
    db
      .select()
      .from(learnerLessonProgress)
      .all()
      .filter(
        (progress) =>
          progress.status === "completed" &&
          progress.completedAt !== null &&
          learnerIds.has(progress.userId)
      )
      .map((progress) => toDateKey(progress.completedAt as Date))
  )
  const startDate = addUtcDays(startOfUtcDay(input.now), -(input.days - 1))

  return Array.from({ length: input.days }, (_, index) => {
    const date = toDateKey(addUtcDays(startDate, index))

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
      (progress) => progress.status === "completed"
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
    .filter((user) => user.status !== "deleted")
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
    .filter((course) => course.status === "active")
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
          unit.status === "active" && activeCourseById.has(unit.courseId)
      )
      .map((unit) => unit.id)
  )

  return db
    .select()
    .from(lessons)
    .all()
    .filter(
      (lesson) =>
        lesson.status === "active" &&
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
            status: "active",
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
            status: "active",
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
            status: "active",
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
            status: "active",
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
    if (!seedCourseIds.has(course.id) && course.status !== "archived") {
      db.update(courses)
        .set({ status: "archived" })
        .where(eq(courses.id, course.id))
        .run()
      archived += 1
    }
  }
  for (const unit of db.select().from(courseUnits).all()) {
    if (!seedUnitIds.has(unit.id) && unit.status !== "archived") {
      db.update(courseUnits)
        .set({ status: "archived" })
        .where(eq(courseUnits.id, unit.id))
        .run()
      archived += 1
    }
  }
  for (const lesson of db.select().from(lessons).all()) {
    if (!seedLessonIds.has(lesson.id) && lesson.status !== "archived") {
      db.update(lessons)
        .set({ status: "archived" })
        .where(eq(lessons.id, lesson.id))
        .run()
      archived += 1
    }
  }
  for (const step of db.select().from(lessonSteps).all()) {
    if (!seedStepIds.has(step.id) && step.status !== "archived") {
      db.update(lessonSteps)
        .set({ status: "archived" })
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
  const filteredUsers = readUserSnapshots(db)
    .filter((user) =>
      input.status === "all"
        ? user.status !== "deleted"
        : user.status === input.status
    )
    .filter(
      (user) =>
        query.length === 0 ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
    .sort((left, right) => compareUsers(left, right, input.sort))
  const totalItems = filteredUsers.length
  const totalPages = Math.max(1, Math.ceil(totalItems / input.pageSize))
  const page = Math.min(Math.max(1, input.page), totalPages)
  const start = (page - 1) * input.pageSize

  return {
    items: filteredUsers.slice(start, start + input.pageSize),
    pagination: {
      page,
      pageSize: input.pageSize,
      totalItems,
      totalPages,
    },
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
      status: "deleted",
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
    .filter((progress) => progress.status === "completed")
  const activityDatesByUserId = groupActivityDatesByUserId(activityRows)

  return userRows.map((user) => {
    const activityDates = activityDatesByUserId.get(user.id) ?? []

    return {
      email: user.email,
      id: user.id,
      joined: toDateKey(user.createdAt),
      lastActive: activityDates[0] ?? null,
      lessonsDone: completedLessonRows.filter(
        (progress) => progress.userId === user.id
      ).length,
      name: user.displayName ?? user.name,
      status: user.status ?? "active",
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
      .filter((course) => course.status === "active")
      .map((course) => course.id)
  )
  const activeUnitIds = new Set(
    db
      .select()
      .from(courseUnits)
      .all()
      .filter(
        (unit) => unit.status === "active" && activeCourseIds.has(unit.courseId)
      )
      .map((unit) => unit.id)
  )

  return db
    .select()
    .from(lessons)
    .all()
    .filter(
      (lesson) =>
        lesson.status === "active" &&
        activeCourseIds.has(lesson.courseId) &&
        activeUnitIds.has(lesson.unitId)
    ).length
}

function compareUsers(
  left: AdminUserSnapshot,
  right: AdminUserSnapshot,
  sort: AdminUserSort
): number {
  const byName = left.name.localeCompare(right.name)

  switch (sort) {
    case "joined":
      return right.joined.localeCompare(left.joined) || byName
    case "lastActive":
      return (
        (right.lastActive ?? "").localeCompare(left.lastActive ?? "") || byName
      )
    case "lessonsDone":
      return right.lessonsDone - left.lessonsDone || byName
    case "streak":
      return right.streak - left.streak || byName
  }
}

function calculateCurrentStreakDays(activityDates: readonly string[]): number {
  if (activityDates.length === 0) {
    return 0
  }

  const activitySet = new Set(activityDates)
  const cursor = new Date(`${activityDates[0]}T00:00:00.000Z`)
  let streak = 0

  while (activitySet.has(toDateKey(cursor))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return streak
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date)

  result.setUTCDate(result.getUTCDate() + days)

  return result
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}
