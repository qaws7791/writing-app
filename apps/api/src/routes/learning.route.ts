import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { z } from "zod"

import {
  courseId,
  courseNotFoundErrorDtoSchema,
  invalidContentSeedErrorDtoSchema,
  lessonId,
  lessonNotFoundErrorDtoSchema,
} from "@workspace/core/content"
import {
  completeLessonDtoSchema,
  courseProgressDtoSchema,
  learningDatabaseUnavailableErrorDtoSchema,
  learningInvalidRequestErrorDtoSchema,
  lessonProgressDtoSchema,
  saveLessonAnswerRequestDtoSchema,
  saveLessonProgressRequestDtoSchema,
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

const learningStatusCodes = {
  "invalid-content": 500,
  "invalid-request": 400,
  "not-found": 404,
  unavailable: 503,
} as const

export function registerLearningRoute(
  app: Hono,
  {
    auth,
    learningService,
  }: Pick<ApiAppDependencies, "auth" | "learningService">
) {
  app.get(
    "/courses/:courseId/progress",
    describeRoute({
      responses: {
        200: {
          description: "현재 학습자의 코스 진행입니다.",
          content: {
            "application/json": {
              schema: resolver(courseProgressDtoSchema),
            },
          },
        },
        401: {
          description: "로그인이 필요합니다.",
          content: jsonErrorResponse(unauthorizedErrorDtoSchema),
        },
        404: {
          description: "코스를 찾을 수 없습니다.",
          content: jsonErrorResponse(courseNotFoundErrorDtoSchema),
        },
        500: {
          description: "콘텐츠 시드가 올바르지 않습니다.",
          content: jsonErrorResponse(invalidContentSeedErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(learningDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const sessionResult = await requireUserSession(context, auth)

      if (sessionResult.status !== "ok") {
        return sessionResult.response
      }

      const result = await learningService.getCourseProgress(
        userId(sessionResult.session.user.id),
        courseId(context.req.param("courseId"))
      )

      return jsonServiceResult(context, result, learningStatusCodes)
    }
  )

  app.get(
    "/lessons/:lessonId/progress",
    describeRoute({
      responses: {
        200: {
          description: "현재 학습자의 레슨 진행입니다.",
          content: {
            "application/json": {
              schema: resolver(lessonProgressDtoSchema),
            },
          },
        },
        401: {
          description: "로그인이 필요합니다.",
          content: jsonErrorResponse(unauthorizedErrorDtoSchema),
        },
        404: {
          description: "레슨을 찾을 수 없습니다.",
          content: jsonErrorResponse(lessonNotFoundErrorDtoSchema),
        },
        500: {
          description: "콘텐츠 시드가 올바르지 않습니다.",
          content: jsonErrorResponse(invalidContentSeedErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(learningDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const sessionResult = await requireUserSession(context, auth)

      if (sessionResult.status !== "ok") {
        return sessionResult.response
      }

      const result = await learningService.getLessonProgress(
        userId(sessionResult.session.user.id),
        lessonId(context.req.param("lessonId"))
      )

      return jsonServiceResult(context, result, learningStatusCodes)
    }
  )

  app.put(
    "/lessons/:lessonId/progress",
    describeRoute({
      responses: {
        200: {
          description: "레슨 진행을 저장했습니다.",
          content: {
            "application/json": {
              schema: resolver(lessonProgressDtoSchema),
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
          description: "레슨을 찾을 수 없습니다.",
          content: jsonErrorResponse(lessonNotFoundErrorDtoSchema),
        },
        500: {
          description: "콘텐츠 시드가 올바르지 않습니다.",
          content: jsonErrorResponse(invalidContentSeedErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(learningDatabaseUnavailableErrorDtoSchema),
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
        saveLessonProgressRequestDtoSchema,
        "Invalid lesson progress body."
      )
      if (request.status !== "ok") {
        return request.response
      }

      const result = await learningService.saveLessonProgress(
        userId(sessionResult.session.user.id),
        lessonId(context.req.param("lessonId")),
        request.data
      )

      return jsonServiceResult(context, result, learningStatusCodes)
    }
  )

  app.put(
    "/lessons/:lessonId/answers",
    describeRoute({
      responses: {
        200: {
          description: "레슨 답변을 저장했습니다.",
          content: {
            "application/json": {
              schema: resolver(z.object({ saved: z.literal(true) })),
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
          description: "레슨을 찾을 수 없습니다.",
          content: jsonErrorResponse(lessonNotFoundErrorDtoSchema),
        },
        500: {
          description: "콘텐츠 시드가 올바르지 않습니다.",
          content: jsonErrorResponse(invalidContentSeedErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(learningDatabaseUnavailableErrorDtoSchema),
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
        saveLessonAnswerRequestDtoSchema,
        "Invalid lesson answer body."
      )
      if (request.status !== "ok") {
        return request.response
      }

      const result = await learningService.saveLessonAnswer(
        userId(sessionResult.session.user.id),
        lessonId(context.req.param("lessonId")),
        request.data
      )

      return jsonServiceResult(context, result, learningStatusCodes)
    }
  )

  app.post(
    "/lessons/:lessonId/complete",
    describeRoute({
      responses: {
        200: {
          description: "레슨을 완료했습니다.",
          content: {
            "application/json": {
              schema: resolver(completeLessonDtoSchema),
            },
          },
        },
        401: {
          description: "로그인이 필요합니다.",
          content: jsonErrorResponse(unauthorizedErrorDtoSchema),
        },
        404: {
          description: "레슨을 찾을 수 없습니다.",
          content: jsonErrorResponse(lessonNotFoundErrorDtoSchema),
        },
        500: {
          description: "콘텐츠 시드가 올바르지 않습니다.",
          content: jsonErrorResponse(invalidContentSeedErrorDtoSchema),
        },
        503: {
          description: "데이터베이스를 사용할 수 없습니다.",
          content: jsonErrorResponse(learningDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const sessionResult = await requireUserSession(context, auth)

      if (sessionResult.status !== "ok") {
        return sessionResult.response
      }

      const result = await learningService.completeLesson(
        userId(sessionResult.session.user.id),
        lessonId(context.req.param("lessonId"))
      )

      return jsonServiceResult(context, result, learningStatusCodes)
    }
  )
}
