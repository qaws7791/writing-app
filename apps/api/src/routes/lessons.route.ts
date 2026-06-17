import { Hono } from "hono"
import {
  lessonIdSchema,
  type LearnerContentService,
} from "@workspace/core/content"

import type { SessionResolver } from "@workspace/core/auth"
import { errorResponse } from "@/routes/error-response"
import { resolveActiveSession } from "@/routes/route-helpers"

export function createLessonsRoute({
  contentService,
  sessionResolver,
}: {
  readonly contentService: LearnerContentService
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
    const result = await contentService.getLesson(lessonId)

    if (result.kind === "err") {
      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(result.value)
  })

  return route
}
