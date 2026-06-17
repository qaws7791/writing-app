import { Hono } from "hono"
import { z } from "zod"
import {
  learningAnswerSchema,
  learnerIdSchema,
  type LearningService,
} from "@workspace/core/learning"
import { lessonIdSchema, lessonStepIdSchema } from "@workspace/core/content"

import type { SessionResolver } from "@/auth/session"
import { errorResponse } from "@/routes/error-response"
import {
  jsonBodyErrorDetail,
  parseJsonBody,
  resolveActiveSession,
} from "@/routes/route-helpers"

const saveAnswerBodySchema = z.object({
  answer: learningAnswerSchema,
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
})

const completeLessonBodySchema = z.object({
  currentStepIndex: z.number().int().nonnegative(),
})

export type LearningRouteDependencies = {
  readonly learningService: LearningService
  readonly now: () => Date
  readonly sessionResolver: SessionResolver
}

export function createLearningRoute({
  learningService,
  now,
  sessionResolver,
}: LearningRouteDependencies): Hono {
  const route = new Hono()

  route.post("/answers", async (context) => {
    const sessionResult = await resolveActiveSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const bodyResult = await parseJsonBody(context, saveAnswerBodySchema)

    if (bodyResult.kind === "err") {
      return context.json(
        errorResponse("invalid_request", jsonBodyErrorDetail(bodyResult.error)),
        400
      )
    }

    const result = await learningService.saveStepAnswer({
      ...bodyResult.value,
      occurredAt: now(),
      userId: learnerIdSchema.parse(sessionResult.session.user.id),
    })

    if (result.kind === "err") {
      if (result.error.kind === "invalid-request") {
        return context.json(errorResponse("invalid_request"), 400)
      }

      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(result.value)
  })

  route.post("/lessons/:lessonId/complete", async (context) => {
    const sessionResult = await resolveActiveSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const lessonIdResult = lessonIdSchema.safeParse(
      context.req.param("lessonId")
    )
    const bodyResult = await parseJsonBody(context, completeLessonBodySchema)

    if (!lessonIdResult.success) {
      return context.json(errorResponse("invalid_request"), 400)
    }

    if (bodyResult.kind === "err") {
      return context.json(
        errorResponse("invalid_request", jsonBodyErrorDetail(bodyResult.error)),
        400
      )
    }

    const result = await learningService.completeLesson({
      ...bodyResult.value,
      lessonId: lessonIdResult.data,
      occurredAt: now(),
      userId: learnerIdSchema.parse(sessionResult.session.user.id),
    })

    if (result.kind === "err") {
      if (result.error.kind === "invalid-request") {
        return context.json(errorResponse("invalid_request"), 400)
      }

      return context.json(errorResponse("not_found"), 404)
    }

    return context.json(result.value)
  })

  return route
}
