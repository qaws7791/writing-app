import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  databaseUnavailableErrorDtoSchema,
  invalidContentSeedErrorDtoSchema,
  lessonDtoSchema,
  lessonId,
  lessonNotFoundErrorDtoSchema,
} from "@workspace/core/content"

import type { ApiAppDependencies } from "@/app"
import { jsonErrorResponse } from "@/routes/error-response"

export function registerLessonsRoutes(
  app: Hono,
  { contentService }: Pick<ApiAppDependencies, "contentService">
) {
  app.get(
    "/lessons/:lessonId",
    describeRoute({
      responses: {
        200: {
          description: "레슨 상세입니다.",
          content: {
            "application/json": {
              schema: resolver(lessonDtoSchema),
            },
          },
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
          content: jsonErrorResponse(databaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await contentService.getLesson(
        lessonId(context.req.param("lessonId"))
      )

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "not-found":
          return context.json(result.error, 404)
        case "unavailable":
          return context.json(result.error, 503)
        case "invalid-content":
          return context.json(result.error, 500)
      }
    }
  )
}
