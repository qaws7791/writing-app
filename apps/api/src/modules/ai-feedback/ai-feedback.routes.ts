import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  learnerApiErrorSchema,
  learnerIdSchema,
} from "@workspace/contracts/learning"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { unwrapApiCoreResult } from "@/errors/map-core-error"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { parseLearnerRouteResponse } from "@/http/learner-response"
import { requireActiveSession } from "@/middleware/auth.middleware"
import {
  aiFeedbackTransitionResultSchema,
  createFeedbackTransitionHeadersSchema,
  createFeedbackTransitionParamsSchema,
} from "@/modules/ai-feedback/ai-feedback.schemas"

const learnerAiFeedbackRouteConfig = {
  method: "post",
  middleware: [requireActiveSession],
  operationId: "createLearnerStepAiFeedback",
  path: "/learning/lessons/{lessonId}/steps/{stepId}/ai-feedback",
  request: {
    headers: createFeedbackTransitionHeadersSchema,
    params: createFeedbackTransitionParamsSchema,
  },
  responses: {
    ...authenticatedResponses(
      jsonResponse(
        "AI 코칭 결과와 다음 학습 상태입니다.",
        aiFeedbackTransitionResultSchema
      )
    ),
    400: jsonResponse("잘못된 요청입니다.", learnerApiErrorSchema),
    404: jsonResponse("레슨을 찾을 수 없습니다.", learnerApiErrorSchema),
    409: jsonResponse("AI 코칭 요청 상태가 충돌합니다.", learnerApiErrorSchema),
    429: jsonResponse(
      "AI 코칭 시도 횟수를 모두 사용했습니다.",
      learnerApiErrorSchema
    ),
    503: jsonResponse(
      "AI provider를 사용할 수 없습니다.",
      learnerApiErrorSchema
    ),
    500: jsonResponse(
      "AI 코칭 콘텐츠 설정이 올바르지 않습니다.",
      learnerApiErrorSchema
    ),
  },
  security: [{ learnerSessionCookie: [] }],
  summary: "현재 AI 코칭 단계 완료",
} satisfies AnyRouteConfig

const learnerAiFeedbackHandler: ApiRouteHandler<
  typeof learnerAiFeedbackRouteConfig
> = async (context) => {
  const { lessonId, stepId } = context.req.valid("param")
  const headers = context.req.valid("header")
  const result =
    await context.var.requestContext.learnerAiFeedbackService.createFeedback({
      idempotencyKey: headers["idempotency-key"],
      lessonId,
      occurredAt: context.var.requestContext.now(),
      stepId,
      userId: learnerIdSchema.parse(context.var.activeSession.user.id),
    })

  return context.json(
    parseLearnerRouteResponse(
      context,
      "LearnerAiFeedbackTransitionResponse",
      aiFeedbackTransitionResultSchema,
      unwrapApiCoreResult(result)
    ),
    200
  )
}

export const learnerAiFeedbackRoute = defineApiRoute({
  ...learnerAiFeedbackRouteConfig,
  handler: learnerAiFeedbackHandler,
})
