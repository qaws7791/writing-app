import { Hono } from "hono"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { errorResponse } from "@/routes/error-response"
import { resolveAdminSession } from "@/routes/route-helpers"
import {
  adminCourseListStatusFilterSchema,
  type AdminCourseListStatusFilter,
  type AdminService,
} from "@workspace/core/admin"

const defaultPage = 1
const defaultPageSize = 20

export type CoursesRouteDependencies = {
  readonly adminService: AdminService
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createCoursesRoute({
  adminService,
  now,
  sessionResolver,
}: CoursesRouteDependencies): Hono {
  const route = new Hono()

  route.get("/", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const query = parseCoursesQuery({
      category: context.req.query("category"),
      page: context.req.query("page"),
      pageSize: context.req.query("pageSize"),
      query: context.req.query("query"),
      status: context.req.query("status"),
    })

    if (query === null) {
      return context.json(errorResponse("invalid_request"), 400)
    }

    return context.json(await adminService.getCourses(query))
  })

  route.post("/", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    return context.json(
      await adminService.createCourse({
        now: now(),
      })
    )
  })

  route.delete("/:courseId", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const result = await adminService.archiveCourse({
      courseId: context.req.param("courseId"),
      now: now(),
    })

    if (result === null) {
      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(result)
  })

  return route
}

function parseCoursesQuery(input: {
  readonly category: string | undefined
  readonly page: string | undefined
  readonly pageSize: string | undefined
  readonly query: string | undefined
  readonly status: string | undefined
}): {
  readonly category: string
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: AdminCourseListStatusFilter
} | null {
  const page = parsePositiveInteger(input.page, defaultPage)
  const pageSize = parsePositiveInteger(input.pageSize, defaultPageSize)
  const statusResult = adminCourseListStatusFilterSchema.safeParse(
    input.status ?? "all"
  )

  if (page === null || pageSize === null || !statusResult.success) {
    return null
  }

  return {
    category: input.category ?? "",
    page,
    pageSize,
    query: input.query ?? "",
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
