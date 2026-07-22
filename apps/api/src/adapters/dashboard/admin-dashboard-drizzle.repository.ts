import type { AdminDashboardDto } from "@workspace/contracts/operations/dashboard-analytics-data"
import { contentStatuses } from "@workspace/contracts/content/status"
import { lessonProgressStatuses } from "@workspace/contracts/learning/status"
import type {
  AdminDashboardReader,
  ReadAdminDashboardInput,
} from "@workspace/core/admin"
import {
  addLearningCalendarDays,
  calculateCurrentStreakDays,
  groupLearningActivityDatesByUserId,
  isLearningDateKeyInRange,
  toLearningDateKey,
  type LearningDateKey,
} from "@workspace/learning/reporting"
import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  OperationsIdentityReportingQuery,
  OperationsIdentitySnapshot,
} from "@workspace/identity/queries"
import {
  learnerActivityDays,
  learnerLessonProgress,
} from "@workspace/learning/schema"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonVersions,
} from "@workspace/content/schema"
import { and, count, eq } from "drizzle-orm"

const recentActivityLimit = 5

export function createAdminDashboardRepository(
  database: WritingAppDatabase,
  identityReporting: OperationsIdentityReportingQuery
): AdminDashboardReader {
  return {
    async readDashboard(input) {
      const learners = await identityReporting.readNonDeletedLearners()
      return readDashboard(database, input, learners)
    },
  }
}

function readDashboard(
  database: WritingAppDatabase,
  input: ReadAdminDashboardInput,
  learners: readonly OperationsIdentitySnapshot[]
): AdminDashboardDto {
  const todayKey = toLearningDateKey(input.now)
  const last7DaysStart = addLearningCalendarDays(todayKey, -6)
  const learnerIds = new Set<string>(learners.map(({ id }) => id))
  const activityRows = database.select().from(learnerActivityDays).all()
  const progressRows = database.select().from(learnerLessonProgress).all()

  return {
    metrics: {
      activeCourses: readActiveCourseCount(database),
      activeLessons: readActiveLessonCount(database),
      activeUsersLast7Days: new Set(
        activityRows
          .filter(
            (row) =>
              learnerIds.has(row.userId) &&
              row.activityDate >= last7DaysStart &&
              row.activityDate <= todayKey
          )
          .map(({ userId }) => userId)
      ).size,
      completedLessons: progressRows.filter(
        (row) =>
          learnerIds.has(row.userId) &&
          row.status === lessonProgressStatuses.completed
      ).length,
      signupsLast7Days: countSignups(learners, {
        end: todayKey,
        start: last7DaysStart,
      }),
      signupsToday: countSignups(learners, {
        end: todayKey,
        start: todayKey,
      }),
      totalUsers: learners.length,
    },
    recentActivities: readRecentActivities(learners, activityRows),
  }
}

function readActiveCourseCount(database: WritingAppDatabase): number {
  return (
    database
      .select({ value: count() })
      .from(courses)
      .where(eq(courses.status, contentStatuses.active))
      .get()?.value ?? 0
  )
}

function readActiveLessonCount(database: WritingAppDatabase): number {
  return (
    database
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

function countSignups(
  learners: readonly OperationsIdentitySnapshot[],
  range: { readonly end: LearningDateKey; readonly start: LearningDateKey }
): number {
  return learners.filter(({ createdAt }) =>
    isLearningDateKeyInRange(toLearningDateKey(createdAt), range)
  ).length
}

function readRecentActivities(
  learners: readonly OperationsIdentitySnapshot[],
  activityRows: readonly (typeof learnerActivityDays.$inferSelect)[]
): AdminDashboardDto["recentActivities"] {
  const activityDatesByUserId = groupLearningActivityDatesByUserId(activityRows)

  return learners
    .flatMap((learner) => {
      const dates = activityDatesByUserId.get(learner.id) ?? []
      const lastActiveDate = [...dates].sort((left, right) =>
        right.localeCompare(left)
      )[0]
      return lastActiveDate === undefined
        ? []
        : [
            {
              currentStreakDays: calculateCurrentStreakDays(dates),
              email: learner.email,
              lastActiveDate,
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
    .slice(0, recentActivityLimit)
}
