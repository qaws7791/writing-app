import type { AdminHttpTransport } from "@/shared/http/admin-http-transport"
import type { AdminApiResult } from "@/shared/http/admin-api-result"
import {
  adminDeleteUserResultSchema,
  adminUserDetailDtoSchema,
  adminUserListDtoSchema,
} from "@workspace/contracts/admin"
import type { UserId } from "@/entities/learner-account/model/learner-account-id"
import type {
  AdminDeleteUserResult,
  AdminUserDetail,
  AdminUserList,
  ReadAdminUsersInput,
} from "@/entities/learner-account/model/admin-learner-account"

export type AdminUsersDal = {
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

export function createAdminUsersDal(
  transport: AdminHttpTransport
): AdminUsersDal {
  const requestUser = async (
    method: "GET" | "PATCH",
    path: string,
    body?: unknown
  ) => {
    const request =
      body === undefined
        ? { method, path, schema: adminUserDetailDtoSchema }
        : { body, method, path, schema: adminUserDetailDtoSchema }
    return transport.requestJson(request)
  }
  return {
    async deleteUser(userId) {
      return transport.requestJson({
        method: "DELETE",
        path: `/api/admin/users/${userId}`,
        schema: adminDeleteUserResultSchema,
      })
    },
    getUser: (userId) => requestUser("GET", `/api/admin/users/${userId}`),
    async getUsers(input) {
      const params = new URLSearchParams()
      params.set("page", String(input.page))
      params.set("pageSize", String(input.pageSize))
      params.set("query", input.query)
      params.set("sort", input.sort)
      params.set("status", input.status)
      return transport.requestJson({
        method: "GET",
        path: `/api/admin/users?${params.toString()}`,
        schema: adminUserListDtoSchema,
      })
    },
    updateUserStatus: (input) =>
      requestUser("PATCH", `/api/admin/users/${input.userId}/status`, {
        status: input.status,
      }),
  }
}
