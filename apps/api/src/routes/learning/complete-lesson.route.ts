import { z } from "@hono/zod-openapi"
import { lessonIdSchema } from "@workspace/core/content"
import { learnerIdSchema, type LearningService } from "@workspace/core/learning"

import type { SessionResolver } from "@workspace/core/auth"
import { errorResponse } from "@/lib/error-response"
import { createRoute, readValidatedJson, readValidatedParam } from "@/lib/hono"
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

const completeLessonParamsSchema = z.object({
  lessonId: lessonIdSchema,
})

const completeLessonBodySchema = z.object({
  currentStepIndex: z.number().int().nonnegative(),
})

export type CompleteLessonRouteDependencies = {
  readonly learningService: LearningService
  readonly now: () => Date
  readonly sessionResolver: SessionResolver
}

export function createCompleteLessonRoute({
  learningService,
  now,
  sessionResolver,
}: CompleteLessonRouteDependencies) {
  return createRoute(
    {
      method: "post",
      middleware: rejectMalformedJsonBody,
      operationId: "completeLesson",
      path: "/lessons/{lessonId}/complete",
      request: {
        body: {
          content: {
            "application/json": {
              schema: completeLessonBodySchema,
            },
          },
          required: true,
        },
        params: completeLessonParamsSchema,
      },
      responses: {
        ...authenticatedResponses(
          jsonResponse("레슨 완료 저장 결과입니다.", savedResponseSchema)
        ),
        400: jsonResponse("잘못된 요청입니다.", errorResponseSchema),
        404: jsonResponse("레슨을 찾을 수 없습니다.", errorResponseSchema),
      },
      security: [{ bearerAuth: [] }],
      summary: "레슨 완료 저장",
    },
    async (context) => {
      const sessionResult = await resolveActiveSession(context, sessionResolver)

      if (sessionResult.kind === "err") {
        return context.json(
          errorResponse(sessionResult.code),
          sessionResult.status
        )
      }

      const { lessonId } = readValidatedParam(
        context,
        completeLessonParamsSchema
      )
      const body = readValidatedJson(context, completeLessonBodySchema)
      const result = await learningService.completeLesson({
        ...body,
        lessonId,
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
