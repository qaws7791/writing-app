import type { AnyRouteConfig } from "@/http/platform/core"
import {
  adminAnalyticsDtoSchema,
  adminDashboardDtoSchema,
  adminLessonAnalyticsSortSchema,
  adminSortDirectionSchema,
} from "@workspace/contracts/admin/dashboard-analytics-data"
import { adminLessonAnalyticsPageDtoSchema } from "@workspace/contracts/admin/admin-analytics"
import type {
  AdminAnalyticsReader,
  AdminDashboardReader,
  ReadAdminLessonAnalyticsResult,
} from "@workspace/core/admin"
import { z } from "@/http/platform/zod"

import type { AdminSessionResolver } from "@workspace/auth/admin/server"
import {
  defineAdminRoute,
  type AdminRouteHandler,
} from "@/admin/admin-hono-env"
import {
  adminAuthenticatedResponses,
  jsonResponse,
} from "@/admin/admin-openapi"
import { adminSessionRouteOptions } from "@/admin/admin-route-options"
import {
  defineAdminRouteGroup,
  type AdminRouteGroup,
} from "@/http/admin-route-group"

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

export type AdminDashboardAnalyticsRouteDependencies = {
  readonly analyticsReader: AdminAnalyticsReader
  readonly dashboardReader: AdminDashboardReader
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createAdminDashboardAnalyticsRoutes(
  dependencies: AdminDashboardAnalyticsRouteDependencies
): AdminRouteGroup {
  return defineAdminRouteGroup([
    createGetDashboardRoute(dependencies),
    createGetAnalyticsRoute(dependencies),
    createGetLessonAnalyticsRoute(dependencies),
  ])
}

function createGetDashboardRoute({
  dashboardReader,
  now,
  sessionResolver,
}: AdminDashboardAnalyticsRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminDashboard",
    path: "/dashboard",
    responses: adminAuthenticatedResponses(
      jsonResponse("어드민 대시보드입니다.", adminDashboardDtoSchema)
    ),
    summary: "어드민 대시보드 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const dashboard = await dashboardReader.readDashboard({
      now: now(),
    })

    return context.json(adminDashboardDtoSchema.parse(dashboard), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createGetAnalyticsRoute({
  analyticsReader,
  now,
  sessionResolver,
}: AdminDashboardAnalyticsRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminAnalytics",
    path: "/analytics",
    request: {
      query: analyticsQuerySchema,
    },
    responses: adminAuthenticatedResponses(
      jsonResponse("어드민 분석 요약입니다.", adminAnalyticsDtoSchema)
    ),
    summary: "어드민 분석 요약 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { days } = context.req.valid("query")
    const analytics = await analyticsReader.readAnalytics({
      days,
      now: now(),
    })

    return context.json(adminAnalyticsDtoSchema.parse(analytics), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createGetLessonAnalyticsRoute({
  analyticsReader,
  sessionResolver,
}: AdminDashboardAnalyticsRouteDependencies) {
  const routeConfig = {
    method: "get",
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
    summary: "어드민 레슨별 분석 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const query = context.req.valid("query")
    const result = await analyticsReader.readLessonAnalytics({
      direction: query.direction,
      page: query.page,
      pageSize: query.pageSize,
      query: query.query,
      sort: query.sort,
    })

    return context.json(toLessonAnalyticsResponse(result), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function positiveIntegerQuery(input: {
  readonly fallback: number
  readonly max?: number
}) {
  const schema = z.coerce.number().int().positive()

  return (input.max === undefined ? schema : schema.max(input.max))
    .optional()
    .default(input.fallback)
}

function toLessonAnalyticsResponse(result: ReadAdminLessonAnalyticsResult) {
  return adminLessonAnalyticsPageDtoSchema.parse({
    items: result.items,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    },
  })
}
