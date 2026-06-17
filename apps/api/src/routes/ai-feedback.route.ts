import { Hono } from "hono"
import { z } from "zod"
import {
  type AiFeedbackService,
  createAiFeedbackCommandSchema,
} from "@workspace/core/ai-feedback"
import { learnerIdSchema } from "@workspace/core/learning"
import { lessonIdSchema, lessonStepIdSchema } from "@workspace/core/content"

import type { SessionResolver } from "@/auth/session"
import { errorResponse } from "@/routes/error-response"
import {
  jsonBodyErrorDetail,
  parseJsonBody,
  resolveActiveSession,
} from "@/routes/route-helpers"

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
    const sessionResult = await resolveActiveSession(context, sessionResolver)

    if (sessionResult.kind === "err") {
      return context.json(
        errorResponse(sessionResult.code),
        sessionResult.status
      )
    }

    const bodyResult = await parseJsonBody(context, createFeedbackBodySchema)

    if (bodyResult.kind === "err") {
      return context.json(
        errorResponse("invalid_request", jsonBodyErrorDetail(bodyResult.error)),
        400
      )
    }

    const result = await aiFeedbackService.createFeedback(
      createAiFeedbackCommandSchema.parse({
        ...bodyResult.value,
        occurredAt: now(),
        userId: learnerIdSchema.parse(sessionResult.session.user.id),
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
