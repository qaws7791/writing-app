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

import type { ApiAppDependencies } from "@/app"
import { jsonErrorResponse } from "@/routes/error-response"
import {
  jsonServiceResult,
  parseJsonBody,
  requireUserSession,
  unauthorizedErrorDtoSchema,
} from "@/routes/route-helpers"

const aiFeedbackStatusCodes = {
  "answer-not-found": 404,
  "feedback-step-not-found": 404,
  "invalid-content": 500,
  "not-found": 404,
  "retry-limit-exceeded": 429,
  unavailable: 503,
} as const

export function registerAiFeedbackRoute(
  app: Hono,
  {
    aiFeedbackService,
    auth,
  }: Pick<ApiAppDependencies, "aiFeedbackService" | "auth">
) {
  // TODO: OpenAI 과금 보호를 위해 /ai-feedback 앞단 rate limiting 정책을 추후 결정한다.
  app.post(
    "/ai-feedback",
    describeRoute({
      responses: {
        200: {
          description: "인공지능 피드백 결과입니다.",
          content: {
            "application/json": {
              schema: resolver(aiFeedbackResultDtoSchema),
            },
          },
        },
        400: {
          description: "요청이 올바르지 않습니다.",
          content: jsonErrorResponse(learningInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "로그인이 필요합니다.",
          content: jsonErrorResponse(unauthorizedErrorDtoSchema),
        },
        404: {
          description: "레슨, 피드백 스텝 또는 답변을 찾을 수 없습니다.",
          content: jsonErrorResponse(
            z.union([
              lessonNotFoundErrorDtoSchema,
              answerNotFoundErrorDtoSchema,
              feedbackStepNotFoundErrorDtoSchema,
            ])
          ),
        },
        429: {
          description: "피드백 재시도 한도를 초과했습니다.",
          content: jsonErrorResponse(feedbackRetryLimitExceededErrorDtoSchema),
        },
        500: {
          description: "콘텐츠 시드가 올바르지 않습니다.",
          content: jsonErrorResponse(invalidContentSeedErrorDtoSchema),
        },
        503: {
          description:
            "인공지능 피드백 또는 데이터베이스를 사용할 수 없습니다.",
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
      const sessionResult = await requireUserSession(context, auth)

      if (sessionResult.status !== "ok") {
        return sessionResult.response
      }

      const request = await parseJsonBody(
        context,
        aiFeedbackRequestDtoSchema,
        "인공지능 피드백 요청 본문이 올바르지 않습니다."
      )
      if (request.status !== "ok") {
        return request.response
      }

      const result = await aiFeedbackService.createFeedback(
        userId(sessionResult.session.user.id),
        request.data
      )

      return jsonServiceResult(context, result, aiFeedbackStatusCodes)
    }
  )
}
