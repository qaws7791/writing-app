import type {
  AdminDashboardDto,
  AdminDashboardRepository,
  ReadAdminDashboardInput,
} from "@workspace/core/admin"
import { contentStatuses, lessonProgressStatuses } from "@workspace/core/status"
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  lt,
  lte,
  sql,
} from "drizzle-orm"

import type { KwepDatabase } from "@workspace/db/client"
import {
  addLearningCalendarDays,
  toLearningDateKey,
} from "@workspace/db/repositories/activity-date"
import {
  calculateCurrentStreakDays,
  createActiveLearnerCondition,
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

const recentActivityLimit = 5

export function createAdminDashboardRepository(
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
