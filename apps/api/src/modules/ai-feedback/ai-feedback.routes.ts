import type { AnyRouteConfig } from "@workspace/hono/core"
import { ErrorResponseSchema } from "@workspace/hono/errors"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { unwrapApiCoreResult } from "@/errors/map-core-error"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { requireActiveSession } from "@/middleware/auth.middleware"
import {
  aiFeedbackResultDtoSchema,
  createFeedbackBodySchema,
  createFeedbackHeadersSchema,
  learnerIdSchema,
} from "@/modules/ai-feedback/ai-feedback.schemas"

const aiFeedbackRouteConfig = {
  method: "post",
  middleware: [requireActiveSession],
  operationId: "createAiFeedback",
  path: "/ai-feedback",
  request: {
    headers: createFeedbackHeadersSchema,
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
    400: jsonResponse("잘못된 요청입니다.", ErrorResponseSchema),
    404: jsonResponse("레슨을 찾을 수 없습니다.", ErrorResponseSchema),
    409: jsonResponse("AI 코칭 요청 상태가 충돌합니다.", ErrorResponseSchema),
    429: jsonResponse(
      "AI 코칭 시도 횟수를 모두 사용했습니다.",
      ErrorResponseSchema
    ),
    503: jsonResponse("AI provider를 사용할 수 없습니다.", ErrorResponseSchema),
    500: jsonResponse(
      "AI 코칭 콘텐츠 설정이 올바르지 않습니다.",
      ErrorResponseSchema
    ),
  },
  security: [{ learnerSessionCookie: [] }],
  summary: "AI 코칭 생성",
} satisfies AnyRouteConfig

const aiFeedbackHandler: ApiRouteHandler<typeof aiFeedbackRouteConfig> = async (
  context
) => {
  const aiFeedbackService = context.var.requestContext.aiFeedbackService

  const body = context.req.valid("json")
  const headers = context.req.valid("header")
  const result = await aiFeedbackService.createFeedback({
    idempotencyKey: headers["idempotency-key"] ?? crypto.randomUUID(),
    lessonId: body.lessonId,
    occurredAt: context.var.requestContext.now(),
    stepId: body.stepId,
    userId: learnerIdSchema.parse(context.var.activeSession.user.id),
  })

  return context.json(unwrapApiCoreResult(result), 200)
}

export const aiFeedbackRoute = defineApiRoute({
  ...aiFeedbackRouteConfig,
  handler: aiFeedbackHandler,
})
