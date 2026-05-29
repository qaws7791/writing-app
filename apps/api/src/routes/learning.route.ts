import type { Context, Hono } from "hono"
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

import { unauthorizedError } from "@/auth/session"
import type { ApiAppDependencies } from "@/app"
import { jsonErrorResponse } from "@/routes/error-response"

const unauthorizedErrorDtoSchema = z.object({
  code: z.literal("unauthorized"),
  message: z.string(),
})

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
      const session = await auth.getSession(context.req.raw.headers)

      if (!session) {
        return context.json(unauthorizedError, 401)
      }

      const result = await learningService.getCourseProgress(
        userId(session.user.id),
        courseId(context.req.param("courseId"))
      )

      return jsonLearningResult(context, result)
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
      const session = await auth.getSession(context.req.raw.headers)

      if (!session) {
        return context.json(unauthorizedError, 401)
      }

      const result = await learningService.getLessonProgress(
        userId(session.user.id),
        lessonId(context.req.param("lessonId"))
      )

      return jsonLearningResult(context, result)
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
      const session = await auth.getSession(context.req.raw.headers)

      if (!session) {
        return context.json(unauthorizedError, 401)
      }

      const body = await readJsonBody(context.req.raw)
      const request = saveLessonProgressRequestDtoSchema.safeParse(body)
      if (!request.success) {
        return context.json(
          invalidRequest("Invalid lesson progress body."),
          400
        )
      }

      const result = await learningService.saveLessonProgress(
        userId(session.user.id),
        lessonId(context.req.param("lessonId")),
        request.data
      )

      return jsonLearningResult(context, result)
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
      const session = await auth.getSession(context.req.raw.headers)

      if (!session) {
        return context.json(unauthorizedError, 401)
      }

      const body = await readJsonBody(context.req.raw)
      const request = saveLessonAnswerRequestDtoSchema.safeParse(body)
      if (!request.success) {
        return context.json(invalidRequest("Invalid lesson answer body."), 400)
      }

      const result = await learningService.saveLessonAnswer(
        userId(session.user.id),
        lessonId(context.req.param("lessonId")),
        request.data
      )

      return jsonLearningResult(context, result)
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
      const session = await auth.getSession(context.req.raw.headers)

      if (!session) {
        return context.json(unauthorizedError, 401)
      }

      const result = await learningService.completeLesson(
        userId(session.user.id),
        lessonId(context.req.param("lessonId"))
      )

      return jsonLearningResult(context, result)
    }
  )
}

function jsonLearningResult(
  context: Context,
  result: {
    status:
      | "ok"
      | "invalid-request"
      | "not-found"
      | "invalid-content"
      | "unavailable"
    value?: unknown
    error?: unknown
  }
) {
  switch (result.status) {
    case "ok":
      return context.json(result.value)
    case "invalid-request":
      return context.json(result.error, 400)
    case "not-found":
      return context.json(result.error, 404)
    case "invalid-content":
      return context.json(result.error, 500)
    case "unavailable":
      return context.json(result.error, 503)
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function invalidRequest(message: string) {
  return {
    code: "invalid-request",
    message,
  }
}
