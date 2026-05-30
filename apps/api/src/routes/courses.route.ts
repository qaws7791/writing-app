import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  courseCategoryListDtoSchema,
  courseDetailDtoSchema,
  courseId,
  courseNotFoundErrorDtoSchema,
  databaseUnavailableErrorDtoSchema,
  invalidContentSeedErrorDtoSchema,
} from "@workspace/core/content"

import type { ApiAppDependencies } from "@/app"
import { jsonErrorResponse } from "@/routes/error-response"

export function registerCoursesRoutes(
  app: Hono,
  { contentService }: Pick<ApiAppDependencies, "contentService">
) {
  app.get(
    "/courses",
    describeRoute({
      responses: {
        200: {
          description: "코스 카테고리 목록입니다.",
          content: {
            "application/json": {
              schema: resolver(courseCategoryListDtoSchema),
            },
          },
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
      const result = await contentService.listCourseCategories()

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "unavailable":
          return context.json(result.error, 503)
        case "invalid-content":
          return context.json(result.error, 500)
        case "not-found":
          return context.json(result.error, 404)
      }
    }
  )

  app.get(
    "/courses/:courseId",
    describeRoute({
      responses: {
        200: {
          description: "코스 상세입니다.",
          content: {
            "application/json": {
              schema: resolver(courseDetailDtoSchema),
            },
          },
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
          content: jsonErrorResponse(databaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const result = await contentService.getCourseDetail(
        courseId(context.req.param("courseId"))
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
