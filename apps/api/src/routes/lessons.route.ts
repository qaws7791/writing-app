import { Hono } from "hono"
import { lessonIdSchema, type ContentRepository } from "@workspace/core/content"

import type { SessionResolver } from "@/auth/session"
import { errorResponse } from "@/routes/error-response"
import { resolveActiveSession } from "@/routes/route-helpers"

export function createLessonsRoute({
  contentRepository,
  sessionResolver,
}: {
  readonly contentRepository: ContentRepository
  readonly sessionResolver: SessionResolver
}): Hono {
  const route = new Hono()

  route.get("/:lessonId", async (context) => {
    const sessionResult = await resolveActiveSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const lessonId = lessonIdSchema.parse(context.req.param("lessonId"))
    const lesson = await contentRepository.findLesson(lessonId)

    if (lesson === null) {
      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(lesson)
  })

  return route
}
