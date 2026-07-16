import type { AdminDashboardDto } from "#core/modules/admin/domain/admin.dto"
import type {
  DashboardReader,
  ReadAdminDashboardInput,
} from "#core/modules/admin/application/ports/admin.repository"
import {
  addLearningCalendarDays,
  isLearningDateKeyInRange,
  toLearningDateKey,
  type LearningDateKey,
} from "#core/modules/learning/domain/learning-date"
import {
  contentStatuses,
  lessonProgressStatuses,
} from "#core/shared/kernel/status"
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm"

import type { WritingAppDatabase } from "@workspace/db/client"
import { userIdSchema } from "@workspace/contracts/admin"
import {
  calculateCurrentStreakDays,
  createActiveLearnerCondition,
  groupActivityDatesByUserId,
} from "#core/modules/admin/infrastructure/persistence/admin-repository-shared"
import {
  authUsers,
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  learnerActivityDays,
  learnerLessonProgress,
  learnerProfiles,
  lessonVersions,
} from "@workspace/db/schema"

const recentActivityLimit = 5

export function createAdminDashboardRepository(
  db: WritingAppDatabase
): DashboardReader {
  return {
    readDashboard(input) {
      return Promise.resolve(readDashboard(db, input))
    },
  }
}

function readDashboard(
  db: WritingAppDatabase,
  input: ReadAdminDashboardInput
): AdminDashboardDto {
  const todayKey = toLearningDateKey(input.now)
  const last7DaysStart = addLearningCalendarDays(todayKey, -6)

  return {
    metrics: {
      activeCourses: readActiveCourseCount(db),
      activeLessons: readActiveLessonCount(db),
      activeUsersLast7Days: readActiveUsersLast7DaysCount(db, {
        last7DaysStart,
        todayKey,
      }),
      completedLessons: readCompletedLessonCount(db),
      signupsLast7Days: readSignupCountByLearningDate(db, {
        end: todayKey,
        start: last7DaysStart,
      }),
      signupsToday: readSignupCountByLearningDate(db, {
        end: todayKey,
        start: todayKey,
      }),
      totalUsers: readLearnerCount(db),
    },
    recentActivities: readRecentActivities(db),
  }
}

function readActiveCourseCount(db: WritingAppDatabase): number {
  return (
    db
      .select({ value: count() })
      .from(courses)
      .where(eq(courses.status, contentStatuses.active))
      .get()?.value ?? 0
  )
}

function readActiveLessonCount(db: WritingAppDatabase): number {
  return (
    db
      .select({ value: count() })
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
          eq(lessonVersions.status, contentStatuses.active),
          eq(courses.status, contentStatuses.active),
          eq(courseCurriculumVersions.status, "published"),
          eq(courseUnitVersions.status, contentStatuses.active)
        )
      )
      .get()?.value ?? 0
  )
}

function readActiveUsersLast7DaysCount(
  db: WritingAppDatabase,
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

function readCompletedLessonCount(db: WritingAppDatabase): number {
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

function readSignupCountByLearningDate(
  db: WritingAppDatabase,
  range: {
    readonly end: LearningDateKey
    readonly start: LearningDateKey
  }
): number {
  return db
    .select({ createdAt: authUsers.createdAt })
    .from(authUsers)
    .leftJoin(learnerProfiles, eq(learnerProfiles.userId, authUsers.id))
    .where(createActiveLearnerCondition())
    .all()
    .filter((user) =>
      isLearningDateKeyInRange(toLearningDateKey(user.createdAt), range)
    ).length
}

function readLearnerCount(db: WritingAppDatabase): number {
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
  db: WritingAppDatabase
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
      ? new Map<string, LearningDateKey[]>()
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
    userId: userIdSchema.parse(user.id),
  }))
}
