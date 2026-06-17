import { Hono } from "hono"

import type { SessionResolver } from "@/auth/session"
import { toCourseProgress, type ProgressReader } from "@/routes/course-progress"
import { errorResponse } from "@/routes/error-response"
import { resolveActiveSession } from "@/routes/route-helpers"
import type { ContentRepository } from "@workspace/core/content"

export type ProgressRouteDependencies = {
  readonly contentRepository: ContentRepository
  readonly progressReader: ProgressReader
  readonly sessionResolver: SessionResolver
}

export function createProgressRoute({
  contentRepository,
  progressReader,
  sessionResolver,
}: ProgressRouteDependencies): Hono {
  const route = new Hono()

  route.get("/", async (context) => {
    const sessionResult = await resolveActiveSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const [courses, progress] = await Promise.all([
      contentRepository.listCourses(),
      progressReader.readLearnerProgress(sessionResult.session.user.id),
    ])
    const courseProgress = await Promise.all(
      courses.map(async (course) => {
        const courseDetail = await contentRepository.findCourseDetail(course.id)

        if (courseDetail === null) {
          return null
        }

        return toCourseProgress(course, courseDetail, progress.lessonProgress)
      })
    )

    return context.json({
      courses: courseProgress.filter((course) => course !== null),
      user: {
        currentStreakDays: progress.currentStreakDays,
      },
    })
  })

  return route
}
