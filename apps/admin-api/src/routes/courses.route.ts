import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminCourseListDtoSchema,
  adminDatabaseUnavailableErrorDtoSchema,
  adminInvalidRequestErrorDtoSchema,
  type AdminCourseListInputDto,
} from "@workspace/core/admin"

import type { AdminApiAppDependencies } from "@/app"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

const courseTreeInclude = "chapters,lessons"
const defaultPage = 1
const defaultPageSize = 10
const allowedPageSizes = [10, 20, 30, 40, 50] as const

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
          description: "Admin course list or course tree.",
          content: {
            "application/json": {
              schema: resolver(adminCourseListDtoSchema),
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
      const include = context.req.query("include")

      if (include === undefined) {
        const input = parseCourseListInput({
          page: context.req.query("page"),
          pageSize: context.req.query("pageSize"),
          query: context.req.query("query"),
        })

        if (input === null) {
          return context.json(
            {
              code: "invalid-request",
              message:
                "page must be positive and pageSize must be one of 10,20,30,40,50.",
            },
            400
          )
        }

        const result = await adminService.listCourses(input)

        switch (result.status) {
          case "ok":
            return context.json(result.value)
          case "unavailable":
            return context.json(result.error, 503)
        }
      }

      if (include !== courseTreeInclude) {
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

function parseCourseListInput(input: {
  page: string | undefined
  pageSize: string | undefined
  query: string | undefined
}): AdminCourseListInputDto | null {
  const page = parsePositiveInteger(input.page, defaultPage)
  const pageSize = parsePositiveInteger(input.pageSize, defaultPageSize)

  if (page === null || pageSize === null || !isAllowedPageSize(pageSize)) {
    return null
  }

  return {
    page,
    pageSize,
    query: input.query?.trim() ?? "",
  }
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (value === undefined) {
    return fallback
  }

  if (!/^\d+$/.test(value)) {
    return null
  }

  const parsedValue = Number(value)

  return parsedValue > 0 ? parsedValue : null
}

function isAllowedPageSize(
  value: number
): value is AdminCourseListInputDto["pageSize"] {
  return allowedPageSizes.some((pageSize) => pageSize === value)
}
