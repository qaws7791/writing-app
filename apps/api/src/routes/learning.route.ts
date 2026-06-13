import { Hono } from "hono"
import { z } from "zod"
import {
  jsonValueSchema,
  learnerIdSchema,
  type LearningService,
} from "@workspace/core/learning"
import { lessonIdSchema, lessonStepIdSchema } from "@workspace/core/content"

import { readBearerToken, type SessionResolver } from "@/auth/session"
import { errorResponse } from "@/routes/error-response"

const saveAnswerBodySchema = z.object({
  answer: jsonValueSchema,
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
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
    const token = readBearerToken(context.req.header("Authorization") ?? null)

    if (token === null) {
      return context.json(errorResponse("unauthorized"), 401)
    }

    const session = await sessionResolver.resolveSession(token)

    if (session === null) {
      return context.json(errorResponse("unauthorized"), 401)
    }

    if (session.user.status !== "active") {
      return context.json(errorResponse("account_unavailable"), 403)
    }

    const bodyResult = saveAnswerBodySchema.safeParse(await context.req.json())

    if (!bodyResult.success) {
      return context.json(errorResponse("invalid_request"), 400)
    }

    const result = await learningService.saveStepAnswer({
      ...bodyResult.data,
      occurredAt: now(),
      userId: learnerIdSchema.parse(session.user.id),
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
