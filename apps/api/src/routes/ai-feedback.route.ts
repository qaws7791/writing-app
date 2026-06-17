import { z } from "@hono/zod-openapi"
import {
  aiFeedbackResultDtoSchema,
  type AiFeedbackService,
  createAiFeedbackCommandSchema,
} from "@workspace/core/ai-feedback"
import { learnerIdSchema } from "@workspace/core/learning"
import { lessonIdSchema, lessonStepIdSchema } from "@workspace/core/content"

import type { SessionResolver } from "@workspace/core/auth"
import { errorResponse } from "@/lib/error-response"
import { createRoute, readValidatedJson } from "@/lib/hono"
import {
  authenticatedResponses,
  errorResponseSchema,
  jsonResponse,
} from "@/lib/openapi-schemas"
import {
  rejectMalformedJsonBody,
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
}: AiFeedbackRouteDependencies) {
  return createRoute(
    {
      method: "post",
      middleware: rejectMalformedJsonBody,
      operationId: "createAiFeedback",
      path: "/",
      request: {
        body: {
          content: {
            "application/json": {
              schema: createFeedbackBodySchema,
            },
          },
          required: true,
        },
      },
      responses: {
        ...authenticatedResponses(
          jsonResponse("AI 코칭 결과입니다.", aiFeedbackResultDtoSchema)
        ),
        400: jsonResponse("잘못된 요청입니다.", errorResponseSchema),
        404: jsonResponse("레슨을 찾을 수 없습니다.", errorResponseSchema),
        429: jsonResponse(
          "AI 코칭 시도 횟수를 모두 사용했습니다.",
          errorResponseSchema
        ),
        503: jsonResponse(
          "AI provider를 사용할 수 없습니다.",
          errorResponseSchema
        ),
      },
      security: [{ bearerAuth: [] }],
      summary: "AI 코칭 생성",
    },
    async (context) => {
      const sessionResult = await resolveActiveSession(context, sessionResolver)

      if (sessionResult.kind === "err") {
        return context.json(
          errorResponse(sessionResult.code),
          sessionResult.status
        )
      }

      const body = readValidatedJson(context, createFeedbackBodySchema)
      const result = await aiFeedbackService.createFeedback(
        createAiFeedbackCommandSchema.parse({
          ...body,
          occurredAt: now(),
          userId: learnerIdSchema.parse(sessionResult.session.user.id),
        })
      )

      if (result.kind === "ok") {
        return context.json(result.value, 200)
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
    }
  )
}
