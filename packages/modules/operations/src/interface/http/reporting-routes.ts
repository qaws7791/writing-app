import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { jsonResponse } from "@workspace/http-platform/openapi"
import {
  adminAnalyticsDtoSchema,
  adminLessonAnalyticsPageDtoSchema,
} from "@workspace/contracts/operations/admin-analytics"
import { adminDashboardDtoSchema } from "@workspace/contracts/operations/admin-dashboard"
import {
  adminAnalyticsQuerySchema,
  adminLessonAnalyticsQuerySchema,
} from "@workspace/contracts/operations/analytics-query"

import type { OperationsReportingQueries } from "#operations/application/operations-reporting"
import type { OperationsAdminSessionPort } from "#operations/application/ports/operations-ports"
import { operationsSessionRouteOptions } from "#operations/interface/http/operations-http-auth"
import {
  defineOperationsRoute,
  mapOperationsError,
  operationsAuthenticatedResponses,
  operationsErrorResponse,
  type OperationsRouteHandler,
} from "#operations/interface/http/operations-http-support"

export function createOperationsReportingRoutes(input: {
  readonly now: () => Date
  readonly queries: OperationsReportingQueries
  readonly session: OperationsAdminSessionPort
}) {
  return Object.freeze([
    createDashboardRoute(input),
    createAnalyticsRoute(input),
    createLessonAnalyticsRoute(input),
  ])
}

function createDashboardRoute(
  input: Parameters<typeof createOperationsReportingRoutes>[0]
) {
  const route = {
    method: "get",
    operationId: "getAdminDashboard",
    path: "/dashboard",
    responses: {
      ...operationsAuthenticatedResponses(
        jsonResponse("어드민 대시보드입니다.", adminDashboardDtoSchema)
      ),
      503: operationsErrorResponse("운영 보고 데이터를 사용할 수 없습니다."),
    },
    summary: "어드민 대시보드 조회",
    ...operationsSessionRouteOptions(input.session),
  } satisfies AnyRouteConfig
  const handler: OperationsRouteHandler<typeof route> = async (context) => {
    const result = await input.queries.readDashboard({ now: input.now() })
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(adminDashboardDtoSchema.parse(result.value), 200)
  }
  return defineOperationsRoute({ ...route, handler })
}

function createAnalyticsRoute(
  input: Parameters<typeof createOperationsReportingRoutes>[0]
) {
  const route = {
    method: "get",
    operationId: "getAdminAnalytics",
    path: "/analytics",
    request: { query: adminAnalyticsQuerySchema },
    responses: {
      ...operationsAuthenticatedResponses(
        jsonResponse("어드민 분석 요약입니다.", adminAnalyticsDtoSchema)
      ),
      503: operationsErrorResponse("운영 보고 데이터를 사용할 수 없습니다."),
    },
    summary: "어드민 분석 요약 조회",
    ...operationsSessionRouteOptions(input.session),
  } satisfies AnyRouteConfig
  const handler: OperationsRouteHandler<typeof route> = async (context) => {
    const query = context.req.valid("query")
    const result = await input.queries.readAnalytics({
      days: query.days,
      now: input.now(),
    })
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(adminAnalyticsDtoSchema.parse(result.value), 200)
  }
  return defineOperationsRoute({ ...route, handler })
}

function createLessonAnalyticsRoute(
  input: Parameters<typeof createOperationsReportingRoutes>[0]
) {
  const route = {
    method: "get",
    operationId: "getAdminLessonAnalytics",
    path: "/analytics/lessons",
    request: { query: adminLessonAnalyticsQuerySchema },
    responses: {
      ...operationsAuthenticatedResponses(
        jsonResponse(
          "어드민 레슨별 분석입니다.",
          adminLessonAnalyticsPageDtoSchema
        )
      ),
      503: operationsErrorResponse("운영 보고 데이터를 사용할 수 없습니다."),
    },
    summary: "어드민 레슨별 분석 조회",
    ...operationsSessionRouteOptions(input.session),
  } satisfies AnyRouteConfig
  const handler: OperationsRouteHandler<typeof route> = async (context) => {
    const result = await input.queries.readLessonAnalytics(
      context.req.valid("query")
    )
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(
      adminLessonAnalyticsPageDtoSchema.parse({
        items: result.value.items,
        pagination: {
          page: result.value.page,
          pageSize: result.value.pageSize,
          totalItems: result.value.totalItems,
          totalPages: result.value.totalPages,
        },
      }),
      200
    )
  }
  return defineOperationsRoute({ ...route, handler })
}
