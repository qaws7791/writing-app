import { z } from "@hono/zod-openapi"

import type { SessionResolver } from "@workspace/core/auth"
import { courseVisualKeySchema } from "@workspace/core/content"
import { errorResponse } from "@/lib/error-response"
import { createRoute } from "@/lib/hono"
import { authenticatedResponses, jsonResponse } from "@/lib/openapi-schemas"
import { resolveActiveSession } from "@/routes/route-helpers"
import type { ProgressService } from "@workspace/core/learning"

export type ProgressRouteDependencies = {
  readonly progressService: ProgressService
  readonly sessionResolver: SessionResolver
}

const progressLessonStatusSchema = z.enum(["available", "completed", "locked"])

const progressLessonSchema = z.object({
  currentStepIndex: z.number().int().nonnegative().nullable(),
  estimatedMinutes: z.number().int().positive(),
  id: z.string(),
  status: progressLessonStatusSchema,
  title: z.string(),
})

const progressNextLessonSchema = progressLessonSchema.extend({
  courseId: z.string(),
})

const progressResponseSchema = z.object({
  courses: z.array(
    z.object({
      id: z.string(),
      lessons: z.array(progressLessonSchema),
      nextLessons: z.array(progressNextLessonSchema),
      progressPercent: z.number().int().min(0).max(100),
      title: z.string(),
      visualKey: courseVisualKeySchema,
    })
  ),
  user: z.object({
    currentStreakDays: z.number().int().nonnegative(),
  }),
})

export function createProgressRoute({
  progressService,
  sessionResolver,
}: ProgressRouteDependencies) {
  return createRoute(
    {
      method: "get",
      operationId: "getProgress",
      path: "/",
      responses: authenticatedResponses(
        jsonResponse("학습자의 코스별 진행 상태입니다.", progressResponseSchema)
      ),
      security: [{ bearerAuth: [] }],
      summary: "학습 진행 조회",
    },
    async (context) => {
      const sessionResult = await resolveActiveSession(context, sessionResolver)

      if (sessionResult.kind === "err") {
        return context.json(
          errorResponse(sessionResult.code),
          sessionResult.status
        )
      }

      return context.json(
        await progressService.readProgress(sessionResult.session.user.id),
        200
      )
    }
  )
}
