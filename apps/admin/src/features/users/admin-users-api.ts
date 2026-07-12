import type { AdminHttpTransport } from "@/lib/api/admin-http-transport"
import type { AdminApiResult } from "@/lib/api/api-result"
import {
  adminDeleteUserResultSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
  type AdminUserDetailDto,
  type AdminUserListDto,
  type UserId,
} from "@workspace/contracts/admin"

export type AdminUserStatus = "active" | "deleted" | "suspended"
export type ReadAdminUsersInput = {
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: "joined" | "lastActive" | "lessonsDone" | "streak"
  readonly status: "all" | AdminUserStatus
}
export type AdminUserListItem = {
  readonly email: string
  readonly id: UserId
  readonly joined: string
  readonly lastActive: string | null
  readonly lessonsDone: number
  readonly name: string
  readonly status: AdminUserStatus
  readonly streak: number
}
export type AdminUserList = {
  readonly items: readonly AdminUserListItem[]
  readonly pagination: AdminUserListDto["pagination"]
}
export type AdminUserDetail = AdminUserListItem & {
  readonly progressPercent: number
  readonly totalLessons: number
}
export type AdminDeleteUserResult = { readonly deleted: true }
export type AdminUsersApi = {
  readonly deleteUser: (
    userId: UserId
  ) => Promise<AdminApiResult<AdminDeleteUserResult>>
  readonly getUser: (userId: UserId) => Promise<AdminApiResult<AdminUserDetail>>
  readonly getUsers: (
    input: ReadAdminUsersInput
  ) => Promise<AdminApiResult<AdminUserList>>
  readonly updateUserStatus: (input: {
    readonly status: "active" | "suspended"
    readonly userId: UserId
  }) => Promise<AdminApiResult<AdminUserDetail>>
}

export function createAdminUsersApi(
  transport: AdminHttpTransport
): AdminUsersApi {
  const requestUser = async (
    method: "GET" | "PATCH",
    path: string,
    body?: unknown
  ) => {
    const request =
      body === undefined
        ? { method, path, schema: adminUserDetailDtoSchema }
        : { body, method, path, schema: adminUserDetailDtoSchema }
    const result = await transport.requestJson(request)
    return result.status === "error"
      ? result
      : { status: "ok" as const, value: toUserDetail(result.value) }
  }
  return {
    async deleteUser(userId) {
      return transport.requestJson({
        method: "DELETE",
        path: `/users/${userId}`,
        schema: adminDeleteUserResultSchema,
      })
    },
    getUser: (userId) => requestUser("GET", `/users/${userId}`),
    async getUsers(input) {
      const params = new URLSearchParams()
      params.set("page", String(input.page))
      params.set("pageSize", String(input.pageSize))
      params.set("query", input.query)
      params.set("sort", input.sort)
      params.set("status", input.status)
      const result = await transport.requestJson({
        method: "GET",
        path: `/users?${params.toString()}`,
        schema: adminUserListDtoSchema,
      })
      return result.status === "error"
        ? result
        : {
            status: "ok",
            value: {
              items: result.value.items.map(toUserListItem),
              pagination: { ...result.value.pagination },
            },
          }
    },
    updateUserStatus: (input) =>
      requestUser("PATCH", `/users/${input.userId}/status`, {
        status: input.status,
      }),
  }
}

function toUserListItem(
  dto: AdminUserListDto["items"][number]
): AdminUserListItem {
  return { ...dto }
}
function toUserDetail(dto: AdminUserDetailDto): AdminUserDetail {
  return {
    ...toUserListItem(dto),
    progressPercent: dto.progressPercent,
    totalLessons: dto.totalLessons,
  }
}
