import { Hono } from "hono"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { errorResponse } from "@/routes/error-response"
import { resolveAdminSession } from "@/routes/route-helpers"
import {
  adminUpdateUserStatusRequestSchema,
  adminUserListStatusFilterSchema,
  adminUserSortSchema,
  type AdminService,
} from "@workspace/core/admin"

const defaultPage = 1
const defaultPageSize = 20

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
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const parsedBody = adminUpdateUserStatusRequestSchema.safeParse(
      await context.req.json().catch(() => null)
    )

    if (!parsedBody.success) {
      return context.json(errorResponse("invalid_request"), 400)
    }

    const user = await adminService.updateUserStatus({
      now: now(),
      status: parsedBody.data.status,
      userId: context.req.param("userId"),
    })

    if (user === null) {
      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(user)
  })

  route.delete("/:userId", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

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
  readonly sort: "joined" | "lastActive" | "lessonsDone" | "streak"
  readonly status: "active" | "all" | "deleted" | "suspended"
} | null {
  const page = parsePositiveInteger(input.page, defaultPage)
  const pageSize = parsePositiveInteger(input.pageSize, defaultPageSize)
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

function parsePositiveInteger(
  value: string | undefined,
  fallback: number
): number | null {
  if (value === undefined || value.trim() === "") {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null
  }

  return parsed
}
