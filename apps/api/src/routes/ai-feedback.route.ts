import { Hono } from "hono"
import { z } from "zod"
import {
  type AiFeedbackService,
  createAiFeedbackCommandSchema,
} from "@workspace/core/ai-feedback"
import { learnerIdSchema } from "@workspace/core/learning"
import { lessonIdSchema, lessonStepIdSchema } from "@workspace/core/content"
import { learnerAccountStatuses } from "@workspace/core/status"

import { readBearerToken, type SessionResolver } from "@/auth/session"
import { errorResponse } from "@/routes/error-response"

const createFeedbackBodySchema = z.object({
  answer: z.string().trim().min(1),
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
})

export type AiFeedbackRouteDependencies = {
  readonly aiFeedbackService: AiFeedbackService
  readonly now: () => Date
  readonly sessionResolver: SessionResolver
}

export function createAiFeedbackRoute({
  aiFeedbackService,
  now,
  sessionResolver,
}: AiFeedbackRouteDependencies): Hono {
  const route = new Hono()

  route.post("/", async (context) => {
    const token = readBearerToken(context.req.header("Authorization") ?? null)

    if (token === null) {
      return context.json(errorResponse("unauthorized"), 401)
    }

    const session = await sessionResolver.resolveSession(token)

    if (session === null) {
      return context.json(errorResponse("unauthorized"), 401)
    }

    if (session.user.status !== learnerAccountStatuses.active) {
      return context.json(errorResponse("account_unavailable"), 403)
    }

    const bodyResult = createFeedbackBodySchema.safeParse(
      await context.req.json()
    )

    if (!bodyResult.success) {
      return context.json(errorResponse("invalid_request"), 400)
    }

    const result = await aiFeedbackService.createFeedback(
      createAiFeedbackCommandSchema.parse({
        ...bodyResult.data,
        occurredAt: now(),
        userId: learnerIdSchema.parse(session.user.id),
      })
    )

    if (result.kind === "ok") {
      return context.json(result.value)
    }

    if (result.error.kind === "attempt-limit-exceeded") {
      return context.json(errorResponse("attempt_limit_exceeded"), 429)
    }

    if (result.error.kind === "provider-failed") {
      return context.json(errorResponse("provider_unavailable"), 503)
    }

    if (result.error.kind === "invalid-request") {
      return context.json(errorResponse("invalid_request"), 400)
    }

    return context.json(errorResponse("not_found"), 404)
  })

  return route
}
