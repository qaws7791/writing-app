import type { AnyRouteConfig } from "@workspace/hono/core"
import { ErrorResponseSchema } from "@workspace/hono/errors"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { mapCoreError } from "@/errors/map-core-error"
import {
  authenticatedResponses,
  jsonResponse,
  savedResponseSchema,
} from "@/http/openapi"
import { requireActiveSession } from "@/middleware/auth.middleware"
import {
  completeLessonBodySchema,
  completeLessonParamsSchema,
  learnerIdSchema,
  saveAnswerBodySchema,
} from "@/modules/learning/learning.schemas"

const saveAnswerRouteConfig = {
  method: "post",
  middleware: [requireActiveSession],
  operationId: "saveLessonAnswer",
  path: "/learning/answers",
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
    400: jsonResponse("잘못된 요청입니다.", ErrorResponseSchema),
    404: jsonResponse("레슨을 찾을 수 없습니다.", ErrorResponseSchema),
  },
  security: [{ bearerAuth: [] }],
  summary: "레슨 답변 저장",
} satisfies AnyRouteConfig

const saveAnswerHandler: ApiRouteHandler<typeof saveAnswerRouteConfig> = async (
  context
) => {
  const learningService = context.var.requestContext.learningService

  const body = context.req.valid("json")
  const result = await learningService.saveStepAnswer({
    ...body,
    occurredAt: context.var.requestContext.now(),
    userId: learnerIdSchema.parse(context.var.activeSession.user.id),
  })

  if (result.kind === "err") {
    throw mapCoreError(result.error)
  }

  return context.json(result.value, 200)
}

export const saveAnswerRoute = defineApiRoute({
  ...saveAnswerRouteConfig,
  handler: saveAnswerHandler,
})

const completeLessonRouteConfig = {
  method: "post",
  middleware: [requireActiveSession],
  operationId: "completeLesson",
  path: "/learning/lessons/{lessonId}/complete",
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
    400: jsonResponse("잘못된 요청입니다.", ErrorResponseSchema),
    404: jsonResponse("레슨을 찾을 수 없습니다.", ErrorResponseSchema),
  },
  security: [{ bearerAuth: [] }],
  summary: "레슨 완료 저장",
} satisfies AnyRouteConfig

const completeLessonHandler: ApiRouteHandler<
  typeof completeLessonRouteConfig
> = async (context) => {
  const learningService = context.var.requestContext.learningService

  const { lessonId } = context.req.valid("param")
  const body = context.req.valid("json")
  const result = await learningService.completeLesson({
    ...body,
    lessonId,
    occurredAt: context.var.requestContext.now(),
    userId: learnerIdSchema.parse(context.var.activeSession.user.id),
  })

  if (result.kind === "err") {
    throw mapCoreError(result.error)
  }

  return context.json(result.value, 200)
}

export const completeLessonRoute = defineApiRoute({
  ...completeLessonRouteConfig,
  handler: completeLessonHandler,
})
