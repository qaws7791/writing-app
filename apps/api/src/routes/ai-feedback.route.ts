import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { z } from "zod"

import {
  invalidContentSeedErrorDtoSchema,
  lessonNotFoundErrorDtoSchema,
} from "@workspace/core/content"
import {
  aiFeedbackRequestDtoSchema,
  aiFeedbackResultDtoSchema,
  aiFeedbackUnavailableErrorDtoSchema,
  answerNotFoundErrorDtoSchema,
  feedbackRetryLimitExceededErrorDtoSchema,
  feedbackStepNotFoundErrorDtoSchema,
} from "@workspace/core/ai-feedback"
import {
  learningDatabaseUnavailableErrorDtoSchema,
  learningInvalidRequestErrorDtoSchema,
  userId,
} from "@workspace/core/learning"

import { unauthorizedError } from "@/auth/session"
import type { ApiAppDependencies } from "@/app"
import { jsonErrorResponse } from "@/routes/error-response"

const unauthorizedErrorDtoSchema = z.object({
  code: z.literal("unauthorized"),
  message: z.string(),
})

export function registerAiFeedbackRoute(
  app: Hono,
  {
    aiFeedbackService,
    auth,
  }: Pick<ApiAppDependencies, "aiFeedbackService" | "auth">
) {
  app.post(
    "/ai-feedback",
    describeRoute({
      responses: {
        200: {
          description: "AI feedback result.",
          content: {
            "application/json": {
              schema: resolver(aiFeedbackResultDtoSchema),
            },
          },
        },
        400: {
          description: "Invalid request.",
          content: jsonErrorResponse(learningInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "Authentication is required.",
          content: jsonErrorResponse(unauthorizedErrorDtoSchema),
        },
        404: {
          description: "Lesson, feedback step, or answer was not found.",
          content: jsonErrorResponse(
            z.union([
              lessonNotFoundErrorDtoSchema,
              answerNotFoundErrorDtoSchema,
              feedbackStepNotFoundErrorDtoSchema,
            ])
          ),
        },
        429: {
          description: "Feedback retry limit was exceeded.",
          content: jsonErrorResponse(feedbackRetryLimitExceededErrorDtoSchema),
        },
        500: {
          description: "Content seed is invalid.",
          content: jsonErrorResponse(invalidContentSeedErrorDtoSchema),
        },
        503: {
          description: "AI feedback or database is unavailable.",
          content: jsonErrorResponse(
            z.union([
              aiFeedbackUnavailableErrorDtoSchema,
              learningDatabaseUnavailableErrorDtoSchema,
            ])
          ),
        },
      },
    }),
    async (context) => {
      const session = await auth.getSession(context.req.raw.headers)

      if (!session) {
        return context.json(unauthorizedError, 401)
      }

      const body = await readJsonBody(context.req.raw)
      const request = aiFeedbackRequestDtoSchema.safeParse(body)
      if (!request.success) {
        return context.json(
          {
            code: "invalid-request",
            message: "Invalid AI feedback body.",
          },
          400
        )
      }

      const result = await aiFeedbackService.createFeedback(
        userId(session.user.id),
        request.data
      )

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "answer-not-found":
          return context.json(result.error, 404)
        case "feedback-step-not-found":
          return context.json(result.error, 404)
        case "retry-limit-exceeded":
          return context.json(result.error, 429)
        case "not-found":
          return context.json(result.error, 404)
        case "invalid-content":
          return context.json(result.error, 500)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
