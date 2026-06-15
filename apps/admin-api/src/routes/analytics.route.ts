import { Hono } from "hono"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { errorResponse } from "@/routes/error-response"
import { parsePositiveIntegerParam } from "@/routes/query-params"
import { resolveAdminSession } from "@/routes/route-helpers"
import {
  adminLessonAnalyticsSortSchema,
  adminSortDirectionSchema,
  type AdminService,
} from "@workspace/core/admin"

const defaultAnalyticsDays = 30
const defaultPage = 1
const defaultPageSize = 10
const maxAnalyticsDays = 365
const maxPageSize = 100

export type AnalyticsRouteDependencies = {
  readonly adminService: AdminService
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createAnalyticsRoute({
  adminService,
  now,
  sessionResolver,
}: AnalyticsRouteDependencies): Hono {
  const route = new Hono()

  route.get("/", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const days = parsePositiveIntegerParam({
      fallback: defaultAnalyticsDays,
      max: maxAnalyticsDays,
      value: context.req.query("days"),
    })

    if (days === null) {
      return context.json(errorResponse("invalid_request"), 400)
    }

    return context.json(
      await adminService.getAnalytics({
        days,
        now: now(),
      })
    )
  })

  route.get("/lessons", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const query = parseLessonAnalyticsQuery({
      direction: context.req.query("direction"),
      page: context.req.query("page"),
      pageSize: context.req.query("pageSize"),
      query: context.req.query("query"),
      sort: context.req.query("sort"),
    })

    if (query === null) {
      return context.json(errorResponse("invalid_request"), 400)
    }

    return context.json(await adminService.getLessonAnalytics(query))
  })

  return route
}

function parseLessonAnalyticsQuery(input: {
  readonly direction: string | undefined
  readonly page: string | undefined
  readonly pageSize: string | undefined
  readonly query: string | undefined
  readonly sort: string | undefined
}): {
  readonly direction: "asc" | "desc"
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: "course" | "completionRate" | "dropOff" | "lesson"
} | null {
  const directionResult = adminSortDirectionSchema.safeParse(
    input.direction ?? "asc"
  )
  const page = parsePositiveIntegerParam({
    fallback: defaultPage,
    value: input.page,
  })
  const pageSize = parsePositiveIntegerParam({
    fallback: defaultPageSize,
    max: maxPageSize,
    value: input.pageSize,
  })
  const sortResult = adminLessonAnalyticsSortSchema.safeParse(
    input.sort ?? "completionRate"
  )

  if (
    !directionResult.success ||
    page === null ||
    pageSize === null ||
    !sortResult.success
  ) {
    return null
  }

  return {
    direction: directionResult.data,
    page,
    pageSize,
    query: input.query ?? "",
    sort: sortResult.data,
  }
}
