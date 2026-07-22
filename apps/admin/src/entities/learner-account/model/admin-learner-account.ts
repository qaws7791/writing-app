import type {
  AdminDeleteUserResultDto,
  AdminUserDetailDto,
  AdminUserListDto,
} from "@workspace/contracts/identity/admin-users"

export type AdminUserStatus = "active" | "deleted" | "suspended"
export type ReadAdminUsersInput = {
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: "joined" | "lastActive" | "lessonsDone" | "streak"
  readonly status: "all" | AdminUserStatus
}
export type AdminUserList = AdminUserListDto
export type AdminUserDetail = AdminUserDetailDto
export type AdminDeleteUserResult = AdminDeleteUserResultDto
