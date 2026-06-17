import { Hono } from "hono"
import {
  courseIdSchema,
  type LearnerContentService,
} from "@workspace/core/content"

import type { SessionResolver } from "@workspace/core/auth"
import { errorResponse } from "@/routes/error-response"
import { resolveActiveSession } from "@/routes/route-helpers"

export function createCoursesRoute({
  contentService,
  sessionResolver,
}: {
  readonly contentService: LearnerContentService
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

    return context.json(await contentService.listCourses())
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
    const result = await contentService.getCourseDetail({
      courseId,
      userId: sessionResult.session.user.id,
    })

    if (result.kind === "err") {
      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(result.value)
  })

  return route
}
