import type {
  deleteAdminUser,
  getAdminUser,
  getAdminUsers,
} from "@workspace/http-client/admin"

export type AdminUserStatus = "active" | "deleted" | "suspended"
export type ReadAdminUsersInput = {
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: "joined" | "lastActive" | "lessonsDone" | "streak"
  readonly status: "all" | AdminUserStatus
}
export type AdminUserList = Awaited<ReturnType<typeof getAdminUsers>>
export type AdminUserDetail = Awaited<ReturnType<typeof getAdminUser>>
export type AdminDeleteUserResult = Awaited<ReturnType<typeof deleteAdminUser>>
