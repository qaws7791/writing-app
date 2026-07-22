import type {
  AdminUserDetailDto,
  AdminUserListItemDto,
  AdminUserListStatusFilter,
  AdminUserSort,
  UserId,
} from "@workspace/contracts/identity/data"

export type ReadAdminUsersInput = {
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminUserSort
  readonly status: AdminUserListStatusFilter
}

export type ReadAdminUsersResult = {
  readonly items: readonly AdminUserListItemDto[]
  readonly page: number
  readonly pageSize: number
  readonly totalItems: number
  readonly totalPages: number
}

export type ReadAdminUserInput = {
  readonly userId: UserId
}

export type AdminUserReader = {
  readonly readUser: (
    input: ReadAdminUserInput
  ) => Promise<AdminUserDetailDto | null>
  readonly readUsers: (
    input: ReadAdminUsersInput
  ) => Promise<ReadAdminUsersResult>
}
