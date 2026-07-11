import type { AnyRouteConfig } from "@workspace/hono/core"
import { ErrorResponseSchema } from "@workspace/hono/errors"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { unwrapApiCoreResult } from "@/errors/map-core-error"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { savedResponseSchema } from "@/http/learner-contract.schemas"
import { requireActiveSession } from "@/middleware/auth.middleware"
import {
  completeLessonParamsSchema,
  learnerIdSchema,
  saveLessonProgressBodySchema,
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
  security: [{ learnerSessionCookie: [] }],
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

  return context.json(unwrapApiCoreResult(result), 200)
}

export const saveAnswerRoute = defineApiRoute({
  ...saveAnswerRouteConfig,
  handler: saveAnswerHandler,
})

const saveLessonProgressRouteConfig = {
  method: "post",
  middleware: [requireActiveSession],
  operationId: "saveLessonProgress",
  path: "/learning/lessons/{lessonId}/progress",
  request: {
    body: {
      content: {
        "application/json": {
          schema: saveLessonProgressBodySchema,
        },
      },
      required: true,
    },
    params: completeLessonParamsSchema,
  },
  responses: {
    ...authenticatedResponses(
      jsonResponse("레슨 진행 저장 결과입니다.", savedResponseSchema)
    ),
    400: jsonResponse("잘못된 요청입니다.", ErrorResponseSchema),
    409: jsonResponse(
      "저장된 진행보다 오래된 요청입니다.",
      ErrorResponseSchema
    ),
    404: jsonResponse("레슨을 찾을 수 없습니다.", ErrorResponseSchema),
  },
  security: [{ learnerSessionCookie: [] }],
  summary: "레슨 진행 저장",
} satisfies AnyRouteConfig

const saveLessonProgressHandler: ApiRouteHandler<
  typeof saveLessonProgressRouteConfig
> = async (context) => {
  const { lessonId } = context.req.valid("param")
  const body = context.req.valid("json")
  const result =
    await context.var.requestContext.learningService.saveLessonProgress({
      ...body,
      lessonId,
      occurredAt: context.var.requestContext.now(),
      userId: learnerIdSchema.parse(context.var.activeSession.user.id),
    })

  return context.json(unwrapApiCoreResult(result), 200)
}

export const saveLessonProgressRoute = defineApiRoute({
  ...saveLessonProgressRouteConfig,
  handler: saveLessonProgressHandler,
})

const completeLessonRouteConfig = {
  method: "post",
  middleware: [requireActiveSession],
  operationId: "completeLesson",
  path: "/learning/lessons/{lessonId}/complete",
  request: {
    params: completeLessonParamsSchema,
  },
  responses: {
    ...authenticatedResponses(
      jsonResponse("레슨 완료 저장 결과입니다.", savedResponseSchema)
    ),
    400: jsonResponse("잘못된 요청입니다.", ErrorResponseSchema),
    404: jsonResponse("레슨을 찾을 수 없습니다.", ErrorResponseSchema),
  },
  security: [{ learnerSessionCookie: [] }],
  summary: "레슨 완료 저장",
} satisfies AnyRouteConfig

const completeLessonHandler: ApiRouteHandler<
  typeof completeLessonRouteConfig
> = async (context) => {
  const learningService = context.var.requestContext.learningService

  const { lessonId } = context.req.valid("param")
  const result = await learningService.completeLesson({
    lessonId,
    occurredAt: context.var.requestContext.now(),
    userId: learnerIdSchema.parse(context.var.activeSession.user.id),
  })

  return context.json(unwrapApiCoreResult(result), 200)
}

export const completeLessonRoute = defineApiRoute({
  ...completeLessonRouteConfig,
  handler: completeLessonHandler,
})
