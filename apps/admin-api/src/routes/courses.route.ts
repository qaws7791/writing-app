import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminCourseTreeDtoSchema,
  adminDatabaseUnavailableErrorDtoSchema,
  adminInvalidRequestErrorDtoSchema,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

const courseTreeInclude = "chapters,lessons"

export function registerCoursesRoute(
  app: Hono,
  { adminService, auth }: Pick<AdminApiAppDependencies, "adminService" | "auth">
) {
  app.get(
    "/courses",
    requireAdminSession(auth),
    describeRoute({
      responses: {
        200: {
          description: "Admin course tree.",
          content: {
            "application/json": {
              schema: resolver(adminCourseTreeDtoSchema),
            },
          },
        },
        400: {
          description: "Course include query is invalid.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "Admin authentication is required.",
        },
        503: {
          description: "Database is unavailable.",
          content: jsonErrorResponse(adminDatabaseUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      if (context.req.query("include") !== courseTreeInclude) {
        return context.json(
          {
            code: "invalid-request",
            message: "include must be chapters,lessons.",
          },
          400
        )
      }

      const result = await adminService.listCourseTree()

      switch (result.status) {
        case "ok":
          return context.json(result.value)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )
}
