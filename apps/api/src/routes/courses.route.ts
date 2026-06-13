import { Hono } from "hono"
import { courseIdSchema, type ContentRepository } from "@workspace/core/content"

import type { SessionResolver } from "@/auth/session"
import { errorResponse } from "@/routes/error-response"
import { resolveActiveSession } from "@/routes/route-helpers"

export function createCoursesRoute({
  contentRepository,
  sessionResolver,
}: {
  readonly contentRepository: ContentRepository
  readonly sessionResolver: SessionResolver
}): Hono {
  const route = new Hono()

  route.get("/", async (context) => {
    const sessionResult = await resolveActiveSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    return context.json({
      courses: await contentRepository.listCourses(),
    })
  })

  route.get("/:courseId", async (context) => {
    const sessionResult = await resolveActiveSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const courseId = courseIdSchema.parse(context.req.param("courseId"))
    const course = await contentRepository.findCourseDetail(courseId)

    if (course === null) {
      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(course)
  })

  return route
}
