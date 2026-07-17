import type { AnyRouteConfig } from "@/http/platform/core"
import {
  learnerApiErrorSchema,
  learnerCompleteStepResponseSchema,
  learnerLessonParamsSchema,
  learnerStartLessonResponseSchema,
} from "@workspace/contracts/learning"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import {
  unwrapLearnerCompleteStepResult,
  unwrapLearnerStartLessonResult,
} from "@/http/learner-command-route-mapper"
import { parseLearnerRouteResponse } from "@/http/learner-response"
import { requireActiveSession } from "@/middleware/auth.middleware"
import {
  completeStepBodySchema,
  completeStepParamsSchema,
  learnerIdSchema,
  startLessonBodySchema,
} from "@/modules/learning/learning.schemas"

const startLessonRouteConfig = {
  method: "post",
  middleware: [requireActiveSession],
  operationId: "startLearnerLesson",
  path: "/learning/lessons/{lessonId}/start",
  request: {
    body: {
      content: {
        "application/json": { schema: startLessonBodySchema },
      },
      required: true,
    },
    params: learnerLessonParamsSchema,
  },
  responses: {
    ...authenticatedResponses(
      jsonResponse(
        "시작한 레슨의 학습 상태입니다.",
        learnerStartLessonResponseSchema
      )
    ),
    404: jsonResponse("레슨을 찾을 수 없습니다.", learnerApiErrorSchema),
    409: jsonResponse("커리큘럼 버전이 변경되었습니다.", learnerApiErrorSchema),
  },
  security: [{ learnerSessionCookie: [] }],
  summary: "레슨 시작",
} satisfies AnyRouteConfig

const startLessonHandler: ApiRouteHandler<
  typeof startLessonRouteConfig
> = async (context) => {
  const { lessonId } = context.req.valid("param")
  const body = context.req.valid("json")
  const result =
    await context.var.requestContext.learnerTransitionRepository.startLesson({
      expectedCurriculumVersionId: body.expectedCurriculumVersionId,
      lessonId,
      occurredAt: context.var.requestContext.now(),
      userId: learnerIdSchema.parse(context.var.activeSession.user.id),
    })

  return context.json(
    parseLearnerRouteResponse(
      context,
      "LearnerStartLessonResponse",
      learnerStartLessonResponseSchema,
      unwrapLearnerStartLessonResult(result)
    ),
    200
  )
}

export const startLessonRoute = defineApiRoute({
  ...startLessonRouteConfig,
  handler: startLessonHandler,
})

const completeStepRouteConfig = {
  method: "post",
  middleware: [requireActiveSession],
  operationId: "completeLearnerStep",
  path: "/learning/lessons/{lessonId}/steps/{stepId}/complete",
  request: {
    body: {
      content: {
        "application/json": { schema: completeStepBodySchema },
      },
      required: true,
    },
    params: completeStepParamsSchema,
  },
  responses: {
    ...authenticatedResponses(
      jsonResponse(
        "단계 완료와 다음 학습 상태입니다.",
        learnerCompleteStepResponseSchema
      )
    ),
    400: jsonResponse("잘못된 요청입니다.", learnerApiErrorSchema),
    404: jsonResponse("레슨을 찾을 수 없습니다.", learnerApiErrorSchema),
    409: jsonResponse(
      "현재 학습 순서와 요청이 다릅니다.",
      learnerApiErrorSchema
    ),
  },
  security: [{ learnerSessionCookie: [] }],
  summary: "현재 레슨 단계 완료",
} satisfies AnyRouteConfig

const completeStepHandler: ApiRouteHandler<
  typeof completeStepRouteConfig
> = async (context) => {
  const { lessonId, stepId } = context.req.valid("param")
  const body = context.req.valid("json")
  const result =
    await context.var.requestContext.learnerTransitionRepository.completeStep({
      completion:
        body.kind === "acknowledge"
          ? { kind: "acknowledge" }
          : { kind: "answer", submission: body.answer },
      lessonId,
      occurredAt: context.var.requestContext.now(),
      stepId,
      userId: learnerIdSchema.parse(context.var.activeSession.user.id),
    })

  return context.json(
    parseLearnerRouteResponse(
      context,
      "LearnerCompleteStepResponse",
      learnerCompleteStepResponseSchema,
      unwrapLearnerCompleteStepResult(result)
    ),
    200
  )
}

export const completeStepRoute = defineApiRoute({
  ...completeStepRouteConfig,
  handler: completeStepHandler,
})
