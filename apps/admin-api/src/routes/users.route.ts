import { Hono } from "hono"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { errorResponse } from "@/routes/error-response"
import { parsePositiveIntegerParam } from "@/routes/query-params"
import {
  jsonBodyErrorDetail,
  parseJsonBody,
  resolveAdminSession,
  resolveOwnerAdminSession,
} from "@/routes/route-helpers"
import {
  adminUpdateUserStatusRequestSchema,
  adminUserListStatusFilterSchema,
  adminUserSortSchema,
  type AdminUserListStatusFilter,
  type AdminUserSort,
} from "@workspace/contracts/admin"
import { type AdminService } from "@workspace/core/admin"

const defaultPage = 1
const defaultPageSize = 20
const maxPageSize = 100

export type UsersRouteDependencies = {
  readonly adminService: AdminService
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createUsersRoute({
  adminService,
  now,
  sessionResolver,
}: UsersRouteDependencies): Hono {
  const route = new Hono()

  route.get("/", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const query = parseUsersQuery({
      page: context.req.query("page"),
      pageSize: context.req.query("pageSize"),
      query: context.req.query("query"),
      sort: context.req.query("sort"),
      status: context.req.query("status"),
    })

    if (query === null) {
      return context.json(errorResponse("invalid_request"), 400)
    }

    return context.json(await adminService.getUsers(query))
  })

  route.get("/:userId", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const user = await adminService.getUser({
      userId: context.req.param("userId"),
    })

    if (user === null) {
      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(user)
  })

  route.patch("/:userId/status", async (context) => {
    const sessionResult = await resolveOwnerAdminSession(
      context,
      sessionResolver
    )

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const parsedBody = await parseJsonBody(
      context,
      adminUpdateUserStatusRequestSchema
    )

    if (parsedBody.kind === "err") {
      return context.json(
        errorResponse("invalid_request", jsonBodyErrorDetail(parsedBody.error)),
        400
      )
    }

    const user = await adminService.updateUserStatus({
      now: now(),
      status: parsedBody.value.status,
      userId: context.req.param("userId"),
    })

    if (user === null) {
      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(user)
  })

  route.delete("/:userId", async (context) => {
    const sessionResult = await resolveOwnerAdminSession(
      context,
      sessionResolver
    )

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const result = await adminService.deleteUser({
      now: now(),
      userId: context.req.param("userId"),
    })

    if (result === null) {
      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(result)
  })

  return route
}

function parseUsersQuery(input: {
  readonly page: string | undefined
  readonly pageSize: string | undefined
  readonly query: string | undefined
  readonly sort: string | undefined
  readonly status: string | undefined
}): {
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminUserSort
  readonly status: AdminUserListStatusFilter
} | null {
  const page = parsePositiveIntegerParam({
    fallback: defaultPage,
    value: input.page,
  })
  const pageSize = parsePositiveIntegerParam({
    fallback: defaultPageSize,
    max: maxPageSize,
    value: input.pageSize,
  })
  const sortResult = adminUserSortSchema.safeParse(input.sort ?? "lastActive")
  const statusResult = adminUserListStatusFilterSchema.safeParse(
    input.status ?? "all"
  )

  if (page === null || pageSize === null || !sortResult.success) {
    return null
  }

  if (!statusResult.success) {
    return null
  }

  return {
    page,
    pageSize,
    query: input.query ?? "",
    sort: sortResult.data,
    status: statusResult.data,
  }
}
