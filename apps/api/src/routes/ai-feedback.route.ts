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

import { unauthorizedError } from "@/auth/session"
import type { ApiAppDependencies } from "@/app"
import { jsonErrorResponse } from "@/routes/error-response"

const unauthorizedErrorDtoSchema = z.object({
  code: z.literal("unauthorized"),
  message: z.string(),
})

export function registerAiFeedbackRoute(
  app: Hono,
  {
    aiFeedbackService,
    auth,
  }: Pick<ApiAppDependencies, "aiFeedbackService" | "auth">
) {
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
      const session = await auth.getSession(context.req.raw.headers)

      if (!session) {
        return context.json(unauthorizedError, 401)
      }

      const body = await readJsonBody(context.req.raw)
      const request = aiFeedbackRequestDtoSchema.safeParse(body)
      if (!request.success) {
        return context.json(
          {
            code: "invalid-request",
            message: "인공지능 피드백 요청 본문이 올바르지 않습니다.",
          },
          400
        )
      }

      const result = await aiFeedbackService.createFeedback(
        userId(session.user.id),
        request.data
      )

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "answer-not-found":
          return context.json(result.error, 404)
        case "feedback-step-not-found":
          return context.json(result.error, 404)
        case "retry-limit-exceeded":
          return context.json(result.error, 429)
        case "not-found":
          return context.json(result.error, 404)
        case "invalid-content":
          return context.json(result.error, 500)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
