import { Hono } from "hono"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { errorResponse } from "@/routes/error-response"
import { resolveAdminSession } from "@/routes/route-helpers"
import type { AdminService } from "@workspace/core/admin"

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
