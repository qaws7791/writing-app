import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  courseCategoryListDtoSchema,
  courseDetailDtoSchema,
  courseId,
} from "@workspace/core/content"

import type { ApiAppDependencies } from "@/app"

export function registerCoursesRoutes(
  app: Hono,
  { contentService }: Pick<ApiAppDependencies, "contentService">
) {
  app.get(
    "/courses",
    describeRoute({
      responses: {
        200: {
          description: "Course categories.",
          content: {
            "application/json": {
              schema: resolver(courseCategoryListDtoSchema),
            },
          },
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
          description: "Course detail.",
          content: {
            "application/json": {
              schema: resolver(courseDetailDtoSchema),
            },
          },
        },
        404: {
          description: "Course was not found.",
        },
        500: {
          description: "Content seed is invalid.",
        },
        503: {
          description: "Database is unavailable.",
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
