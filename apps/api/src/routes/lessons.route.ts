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
          description: "Lesson detail.",
          content: {
            "application/json": {
              schema: resolver(lessonDtoSchema),
            },
          },
        },
        404: {
          description: "Lesson was not found.",
          content: jsonErrorResponse(lessonNotFoundErrorDtoSchema),
        },
        500: {
          description: "Content seed is invalid.",
          content: jsonErrorResponse(invalidContentSeedErrorDtoSchema),
        },
        503: {
          description: "Database is unavailable.",
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
