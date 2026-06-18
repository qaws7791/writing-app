import type { AnyRouteConfig } from "@workspace/hono/core"
import { ErrorResponseSchema } from "@workspace/hono/errors"

import { defineApiRoute, type ApiRouteHandler } from "@/context/hono-env"
import { mapCoreError } from "@/errors/map-core-error"
import { authenticatedResponses, jsonResponse } from "@/http/openapi"
import { requireActiveSession } from "@/middleware/auth.middleware"
import {
  aiFeedbackResultDtoSchema,
  createAiFeedbackCommandSchema,
  createFeedbackBodySchema,
  learnerIdSchema,
} from "@/modules/ai-feedback/ai-feedback.schemas"

const aiFeedbackRouteConfig = {
  method: "post",
  middleware: [requireActiveSession],
  operationId: "createAiFeedback",
  path: "/ai-feedback",
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
    400: jsonResponse("잘못된 요청입니다.", ErrorResponseSchema),
    404: jsonResponse("레슨을 찾을 수 없습니다.", ErrorResponseSchema),
    429: jsonResponse(
      "AI 코칭 시도 횟수를 모두 사용했습니다.",
      ErrorResponseSchema
    ),
    503: jsonResponse("AI provider를 사용할 수 없습니다.", ErrorResponseSchema),
  },
  security: [{ bearerAuth: [] }],
  summary: "AI 코칭 생성",
} satisfies AnyRouteConfig

const aiFeedbackHandler: ApiRouteHandler<typeof aiFeedbackRouteConfig> = async (
  context
) => {
  const aiFeedbackService = context.var.requestContext.aiFeedbackService

  if (aiFeedbackService === undefined) {
    throw new Error("AI feedback service is not configured.")
  }

  const body = context.req.valid("json")
  const result = await aiFeedbackService.createFeedback(
    createAiFeedbackCommandSchema.parse({
      ...body,
      occurredAt: context.var.requestContext.now(),
      userId: learnerIdSchema.parse(context.var.activeSession.user.id),
    })
  )

  if (result.kind === "err") {
    throw mapCoreError(result.error)
  }

  return context.json(result.value, 200)
}

export const aiFeedbackRoute = defineApiRoute({
  ...aiFeedbackRouteConfig,
  handler: aiFeedbackHandler,
})
