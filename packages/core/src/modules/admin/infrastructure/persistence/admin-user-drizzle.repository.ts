import type {
  AdminDeleteUserResultDto,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUserSort,
  AdminUserStatus,
} from "#core/modules/admin/domain/admin.dto"
import type {
  DeleteAdminUserInput,
  ReadAdminUserInput,
  ReadAdminUsersInput,
  UpdateAdminUserStatusInput,
  UserAdminRepository,
} from "#core/modules/admin/application/ports/admin.repository"
import {
  toLearningDateKey,
  type LearningDateKey,
} from "#core/modules/learning/domain/learning-date"
import {
  contentStatuses,
  learnerAccountStatuses,
  lessonProgressStatuses,
} from "#core/shared/kernel/status"
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

import type { WritingAppDatabase } from "@workspace/db/client"
import {
  calculateCurrentStreakDays,
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
import { userIdSchema, type UserId } from "@workspace/contracts/admin"

export function createAdminUserRepository(
  db: WritingAppDatabase
): UserAdminRepository {
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
  readonly id: UserId
  readonly joined: string
  readonly lastActive: string | null
  readonly lessonsDone: number
  readonly name: string
  readonly status: AdminUserStatus
  readonly streak: number
}

function readUsers(
  db: WritingAppDatabase,
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

  return {
    items: rows.map((user) => ({
      email: user.email,
      id: userIdSchema.parse(user.id),
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
  db: WritingAppDatabase,
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
  db: WritingAppDatabase,
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
  db: WritingAppDatabase,
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

function readUserSnapshots(db: WritingAppDatabase): AdminUserSnapshot[] {
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
      id: userIdSchema.parse(user.id),
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

function countActiveLessons(db: WritingAppDatabase): number {
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
          eq(courses.status, contentStatuses.active),
          eq(courseCurriculumVersions.status, "published"),
          eq(courseUnitVersions.status, contentStatuses.active),
          eq(lessonVersions.status, contentStatuses.active)
        )
      )
      .get()?.value ?? 0
  )
}
