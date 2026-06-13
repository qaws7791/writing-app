import type {
  AdminDashboardDto,
  AdminDeleteUserResultDto,
  AdminRepository,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUserSort,
  AdminUserStatus,
  DeleteAdminUserInput,
  ReadAdminDashboardInput,
  ReadAdminUserInput,
  ReadAdminUsersInput,
  UpdateAdminUserStatusInput,
} from "@workspace/core/admin"
import { eq } from "drizzle-orm"

import type { KwepDatabase } from "@workspace/db/client"
import {
  authUsers,
  courses,
  courseUnits,
  learnerActivityDays,
  learnerLessonProgress,
  learnerProfiles,
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
    readDashboard(input) {
      return Promise.resolve(readDashboard(db, input))
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
