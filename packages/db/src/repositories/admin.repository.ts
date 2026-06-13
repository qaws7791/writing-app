import type {
  AdminDashboardDto,
  AdminDashboardRepository,
  ReadAdminDashboardInput,
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
): AdminDashboardRepository {
  return {
    readDashboard(input) {
      return Promise.resolve(readDashboard(db, input))
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
