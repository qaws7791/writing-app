import { err, ok, type Result } from "@workspace/kernel/result"
import type { UserId } from "@workspace/types/ids"
import { toPlatformDayKey } from "@workspace/kernel/day-boundary"

import type { AdminActor } from "#identity/domain/admin-actor"
import type { IdentityError } from "#identity/domain/identity-error"
import type { UserStatus } from "#identity/domain/user-status"
import { userStatuses } from "#identity/domain/user-status"
import type {
  AdminUserCursorCodec,
  AdminUserPagePort,
  AdminUserPageRow,
  AdminUserSort,
  AdminUserStatusFilter,
  IdentityLearningReportPort,
  IdentityRepository,
  LearnerAccount,
  LearnerIdentityDirectoryPort,
} from "#identity/application/identity-ports"
import type { IdentityApplication } from "#identity/application/identity-service"
import { findLearnerAccount } from "#identity/application/learner-account-reader"

type AdminUserListItem = Readonly<{
  email: string
  id: UserId
  joined: string
  lastActive: string | null
  lessonsDone: number
  name: string
  status: UserStatus
  streak: number
}>

type AdminUserDetail = AdminUserListItem &
  Readonly<{
    progressPercent: number
    totalLessons: number
  }>

type ReadAdminUsersInput = Readonly<{
  cursor?: string
  direction: "next" | "previous"
  pageSize: number
  query: string
  sort: AdminUserSort
  status: AdminUserStatusFilter
}>

export type ReadAdminUsersResult = Readonly<{
  hasNextPage: boolean
  hasPreviousPage: boolean
  items: readonly AdminUserListItem[]
  nextCursor: string | null
  pageSize: number
  previousCursor: string | null
}>

export class InvalidAdminUserCursorError extends Error {
  constructor() {
    super("관리자 사용자 목록 cursor가 유효하지 않습니다.")
    this.name = "InvalidAdminUserCursorError"
  }
}

export type AdminUserReader = Readonly<{
  readUser: (input: {
    readonly userId: UserId
  }) => Promise<AdminUserDetail | null>
  readUsers: (input: ReadAdminUsersInput) => Promise<ReadAdminUsersResult>
}>

export type AdminUserMutationUseCase = Readonly<{
  deleteUser: (input: {
    readonly actor: AdminActor
    readonly userId: UserId
  }) => Promise<Result<void, IdentityError>>
  updateUserStatus: (input: {
    readonly actor: AdminActor
    readonly status: Exclude<UserStatus, "deleted">
    readonly userId: UserId
  }) => Promise<Result<AdminUserDetail, IdentityError>>
}>

export type IdentityLearningQuery = Readonly<{
  readLearnerStatus: (
    userId: UserId
  ) => Promise<Result<UserStatus, IdentityError>>
}>

export function createAdminUserReader(input: {
  readonly adminUserPage: AdminUserPagePort
  readonly cursor: AdminUserCursorCodec
  readonly learningReport: IdentityLearningReportPort
  readonly learnerIdentityDirectory: LearnerIdentityDirectoryPort
  readonly repository: IdentityRepository
}): AdminUserReader {
  return {
    async readUser({ userId }) {
      const account = await findLearnerAccount(input, userId)
      if (account === null) return null

      const [report] = await input.learningReport.readLearnerReports([userId])
      const totalLessons = await input.learningReport.readActiveLessonCount()
      const item = toAdminUserListItem(account, report)

      return {
        ...item,
        progressPercent:
          totalLessons === 0
            ? 0
            : Math.round((item.lessonsDone / totalLessons) * 100),
        totalLessons,
      }
    },
    async readUsers(query) {
      const normalizedQuery = query.query.trim().toLowerCase()
      const fingerprint = input.cursor.createFingerprint({
        query: normalizedQuery,
        sort: query.sort,
        status: query.status,
      })
      const after =
        query.cursor === undefined
          ? undefined
          : input.cursor.decode(query.cursor, fingerprint)
      if (query.cursor !== undefined && after === null) {
        throw new InvalidAdminUserCursorError()
      }

      const rows = await input.adminUserPage.readPage({
        ...(after === undefined || after === null ? {} : { after }),
        direction: query.direction,
        limit: query.pageSize + 1,
        query: normalizedQuery,
        sort: query.sort,
        status: query.status,
      })
      const hasMore = rows.length > query.pageSize
      const pageRows = rows.slice(0, query.pageSize)
      if (query.direction === "previous") pageRows.reverse()
      const first = pageRows.at(0)
      const last = pageRows.at(-1)

      return {
        hasNextPage:
          query.direction === "previous"
            ? after !== undefined && after !== null
            : hasMore,
        hasPreviousPage:
          query.direction === "next"
            ? after !== undefined && after !== null
            : hasMore,
        items: pageRows.map(toAdminUserPageItem),
        nextCursor:
          last !== undefined && (query.direction === "previous" || hasMore)
            ? input.cursor.encode({
                fingerprint,
                position: {
                  primary: readSortValue(last, query.sort),
                  userId: last.userId,
                },
              })
            : null,
        pageSize: query.pageSize,
        previousCursor:
          first !== undefined &&
          (query.direction === "next"
            ? after !== undefined && after !== null
            : hasMore)
            ? input.cursor.encode({
                fingerprint,
                position: {
                  primary: readSortValue(first, query.sort),
                  userId: first.userId,
                },
              })
            : null,
      }
    },
  }
}

function toAdminUserPageItem(row: AdminUserPageRow): AdminUserListItem {
  const deleted = row.status === userStatuses.deleted

  return {
    email: deleted ? "deleted@example.invalid" : row.email,
    id: row.userId,
    joined: toPlatformDayKey(row.joinedAt),
    lastActive: row.lastActive,
    lessonsDone: row.lessonsDone,
    name: row.name,
    status: row.status,
    streak: row.streak,
  }
}

function readSortValue(
  row: AdminUserPageRow,
  sort: AdminUserSort
): number | string | null {
  switch (sort) {
    case "joined":
      return row.joinedAt.getTime()
    case "lastActive":
      return row.lastActive
    case "lessonsDone":
      return row.lessonsDone
    case "streak":
      return row.streak
  }
}

export function createAdminUserMutationUseCase(input: {
  readonly application: Pick<
    IdentityApplication,
    "changeUserStatus" | "deleteUser"
  >
  readonly reader: AdminUserReader
}): AdminUserMutationUseCase {
  return {
    async deleteUser(command) {
      const result = await input.application.deleteUser(command)
      return result.isErr() ? err(result.error) : ok(undefined)
    },
    async updateUserStatus(command) {
      const result = await input.application.changeUserStatus(command)
      if (result.isErr()) return err(result.error)

      const detail = await input.reader.readUser({ userId: command.userId })
      return detail === null ? err({ kind: "identity-not-found" }) : ok(detail)
    },
  }
}

export function createIdentityLearningQuery(
  dependencies: Readonly<{
    learnerIdentityDirectory: LearnerIdentityDirectoryPort
    repository: IdentityRepository
  }>
): IdentityLearningQuery {
  return {
    async readLearnerStatus(userId) {
      const account = await findLearnerAccount(dependencies, userId)
      return account === null
        ? err({ kind: "identity-not-found" })
        : ok(account.profile.profile.status)
    },
  }
}

function toAdminUserListItem(
  account: LearnerAccount,
  report:
    | Awaited<
        ReturnType<IdentityLearningReportPort["readLearnerReports"]>
      >[number]
    | undefined
): AdminUserListItem {
  const deleted = account.profile.profile.status === userStatuses.deleted

  return {
    email: deleted ? "deleted@example.invalid" : account.email,
    id: account.id,
    joined: toPlatformDayKey(account.createdAt),
    lastActive: report?.lastActive ?? null,
    lessonsDone: report?.completedLessons ?? 0,
    name: account.profile.profile.displayName,
    status: account.profile.profile.status,
    streak: report?.currentStreakDays ?? 0,
  }
}
