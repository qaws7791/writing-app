import { Hono } from "hono"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { errorResponse } from "@/routes/error-response"
import { resolveAdminSession } from "@/routes/route-helpers"
import type { AdminService } from "@workspace/core/admin"

export type CurriculumEditorRouteDependencies = {
  readonly adminService: AdminService
  readonly sessionResolver: AdminSessionResolver
}

export function createCurriculumEditorRoute({
  adminService,
  sessionResolver,
}: CurriculumEditorRouteDependencies): Hono {
  const route = new Hono()

  route.get("/:courseId/editor", async (context) => {
    const sessionResult = await resolveAdminSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const course = await adminService.getCourseEditor({
      courseId: context.req.param("courseId"),
    })

    if (course === null) {
      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(course)
  })

  return route
}
