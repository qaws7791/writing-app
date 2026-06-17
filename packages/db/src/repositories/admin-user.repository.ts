import type {
  AdminDeleteUserResultDto,
  AdminRepository,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUserSort,
  AdminUserStatus,
  DeleteAdminUserInput,
  ReadAdminUserInput,
  ReadAdminUsersInput,
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
  desc,
  eq,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm"

import type { KwepDatabase } from "@workspace/db/client"
import { toLearningDateKey } from "@workspace/db/repositories/activity-date"
import {
  calculateCurrentStreakDays,
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

type AdminUserRepository = Pick<
  AdminRepository,
  "deleteUser" | "readUser" | "readUsers" | "updateUserStatus"
>

export function createAdminUserRepository(
  db: KwepDatabase
): AdminUserRepository {
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
