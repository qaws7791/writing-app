import { err, ok, type Result } from "@workspace/kernel/result"
import type { UserId } from "@workspace/types/ids"
import { toPlatformDayKey } from "@workspace/kernel/day-boundary"

import type { AdminActor } from "#identity/domain/admin-actor"
import type { IdentityError } from "#identity/domain/identity-error"
import type { UserStatus } from "#identity/domain/user-status"
import { userStatuses } from "#identity/domain/user-status"
import type {
  IdentityLearningReportPort,
  IdentityRepository,
  LearnerAccount,
  LearnerIdentityDirectoryPort,
} from "#identity/application/identity-ports"
import type { IdentityApplication } from "#identity/application/identity-service"
import {
  findLearnerAccount,
  listLearnerAccounts,
} from "#identity/application/learner-account-reader"

type AdminUserSort = "joined" | "lastActive" | "lessonsDone" | "streak"
type AdminUserStatusFilter = UserStatus | "all"

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

export type AdminUserDetail = AdminUserListItem &
  Readonly<{
    progressPercent: number
    totalLessons: number
  }>

type ReadAdminUsersInput = Readonly<{
  page: number
  pageSize: number
  query: string
  sort: AdminUserSort
  status: AdminUserStatusFilter
}>

export type ReadAdminUsersResult = Readonly<{
  items: readonly AdminUserListItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}>

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
      const accounts = await listLearnerAccounts(input, {
        query: query.query,
        status: query.status,
      })
      const reports = await input.learningReport.readLearnerReports(
        accounts.map(({ id }) => id)
      )
      const reportsByUserId = new Map(
        reports.map((report) => [report.userId, report])
      )
      const items = accounts
        .map((account) =>
          toAdminUserListItem(account, reportsByUserId.get(account.id))
        )
        .sort(createAdminUserComparator(query.sort))
      const totalItems = items.length
      const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize))
      const page = Math.min(Math.max(1, query.page), totalPages)

      return {
        items: items.slice((page - 1) * query.pageSize, page * query.pageSize),
        page,
        pageSize: query.pageSize,
        totalItems,
        totalPages,
      }
    },
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

function createAdminUserComparator(sort: AdminUserSort) {
  return (left: AdminUserListItem, right: AdminUserListItem): number => {
    switch (sort) {
      case "joined":
        return compareDescending(left.joined, right.joined) || compareName()
      case "lastActive":
        return (
          compareDescending(left.lastActive ?? "", right.lastActive ?? "") ||
          compareName()
        )
      case "lessonsDone":
        return right.lessonsDone - left.lessonsDone || compareName()
      case "streak":
        return right.streak - left.streak || compareName()
    }

    function compareName(): number {
      return left.name.localeCompare(right.name)
    }
  }
}

function compareDescending(left: string, right: string): number {
  return right.localeCompare(left)
}
