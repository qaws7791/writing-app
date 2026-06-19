import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminAnalyticsDtoSchema,
  adminLessonAnalyticsPageDtoSchema,
  adminLessonAnalyticsSortSchema,
  adminSortDirectionSchema,
} from "@workspace/contracts/admin"
import { type AdminService } from "@workspace/core/admin"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import { adminAuthenticatedResponses, jsonResponse } from "@/http/openapi"
import { createRequireAdminSessionMiddleware } from "@/middleware/admin-auth.middleware"
import { positiveIntegerQuery } from "@/routes/query-schemas"

const defaultAnalyticsDays = 30
const defaultPage = 1
const defaultPageSize = 10
const maxAnalyticsDays = 365
const maxPageSize = 100

const analyticsQuerySchema = z.object({
  days: positiveIntegerQuery({
    fallback: defaultAnalyticsDays,
    max: maxAnalyticsDays,
  }),
})

const lessonAnalyticsQuerySchema = z.object({
  direction: adminSortDirectionSchema.optional().default("asc"),
  page: positiveIntegerQuery({
    fallback: defaultPage,
  }),
  pageSize: positiveIntegerQuery({
    fallback: defaultPageSize,
    max: maxPageSize,
  }),
  query: z.string().optional().default(""),
  sort: adminLessonAnalyticsSortSchema.optional().default("completionRate"),
})

export type AnalyticsRouteDependencies = {
  readonly adminService: AdminService
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createAnalyticsRoutes(
  dependencies: AnalyticsRouteDependencies
) {
  return [
    createGetAnalyticsRoute(dependencies),
    createGetLessonAnalyticsRoute(dependencies),
  ] as const
}

function createGetAnalyticsRoute({
  adminService,
  now,
  sessionResolver,
}: AnalyticsRouteDependencies) {
  const routeConfig = {
    method: "get",
    middleware: [createRequireAdminSessionMiddleware(sessionResolver)],
    operationId: "getAdminAnalytics",
    path: "/analytics",
    request: {
      query: analyticsQuerySchema,
    },
    responses: adminAuthenticatedResponses(
      jsonResponse("어드민 분석 요약입니다.", adminAnalyticsDtoSchema)
    ),
    security: [{ adminSessionCookie: [] }],
    summary: "어드민 분석 요약 조회",
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { days } = context.req.valid("query")

    return context.json(
      await adminService.getAnalytics({
        days,
        now: now(),
      }),
      200
    )
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createGetLessonAnalyticsRoute({
  adminService,
  sessionResolver,
}: AnalyticsRouteDependencies) {
  const routeConfig = {
    method: "get",
    middleware: [createRequireAdminSessionMiddleware(sessionResolver)],
    operationId: "getAdminLessonAnalytics",
    path: "/analytics/lessons",
    request: {
      query: lessonAnalyticsQuerySchema,
    },
    responses: adminAuthenticatedResponses(
      jsonResponse(
        "어드민 레슨별 분석입니다.",
        adminLessonAnalyticsPageDtoSchema
      )
    ),
    security: [{ adminSessionCookie: [] }],
    summary: "어드민 레슨별 분석 조회",
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const query = context.req.valid("query")

    return context.json(await adminService.getLessonAnalytics(query), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}
