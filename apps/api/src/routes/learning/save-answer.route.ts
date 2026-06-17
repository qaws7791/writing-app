import { z } from "@hono/zod-openapi"
import { lessonIdSchema, lessonStepIdSchema } from "@workspace/core/content"
import {
  learningAnswerSchema,
  learnerIdSchema,
  type LearningService,
} from "@workspace/core/learning"

import type { SessionResolver } from "@workspace/core/auth"
import { errorResponse } from "@/lib/error-response"
import { createRoute, readValidatedJson } from "@/lib/hono"
import {
  authenticatedResponses,
  errorResponseSchema,
  jsonResponse,
  savedResponseSchema,
} from "@/lib/openapi-schemas"
import {
  rejectMalformedJsonBody,
  resolveActiveSession,
} from "@/routes/route-helpers"

const saveAnswerBodySchema = z.object({
  answer: learningAnswerSchema,
  lessonId: lessonIdSchema,
  stepId: lessonStepIdSchema,
})

export type SaveAnswerRouteDependencies = {
  readonly learningService: LearningService
  readonly now: () => Date
  readonly sessionResolver: SessionResolver
}

export function createSaveAnswerRoute({
  learningService,
  now,
  sessionResolver,
}: SaveAnswerRouteDependencies) {
  return createRoute(
    {
      method: "post",
      middleware: rejectMalformedJsonBody,
      operationId: "saveLessonAnswer",
      path: "/answers",
      request: {
        body: {
          content: {
            "application/json": {
              schema: saveAnswerBodySchema,
            },
          },
          required: true,
        },
      },
      responses: {
        ...authenticatedResponses(
          jsonResponse("답변 저장 결과입니다.", savedResponseSchema)
        ),
        400: jsonResponse("잘못된 요청입니다.", errorResponseSchema),
        404: jsonResponse("레슨을 찾을 수 없습니다.", errorResponseSchema),
      },
      security: [{ bearerAuth: [] }],
      summary: "레슨 답변 저장",
    },
    async (context) => {
      const sessionResult = await resolveActiveSession(context, sessionResolver)

      if (sessionResult.kind === "err") {
        return context.json(
          errorResponse(sessionResult.code),
          sessionResult.status
        )
      }

      const body = readValidatedJson(context, saveAnswerBodySchema)
      const result = await learningService.saveStepAnswer({
        ...body,
        occurredAt: now(),
        userId: learnerIdSchema.parse(sessionResult.session.user.id),
      })

      if (result.kind === "err") {
        if (result.error.kind === "invalid-request") {
          return context.json(errorResponse("invalid_request"), 400)
        }

        return context.json(errorResponse("not_found"), 404)
      }

      return context.json(result.value, 200)
    }
  )
}
