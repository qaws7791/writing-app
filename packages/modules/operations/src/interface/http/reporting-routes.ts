import {
  createRoute,
  type OpenAPIHono,
  type RouteConfig,
} from "@hono/zod-openapi"
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
import {
  operationsSessionRouteOptions,
  type OperationsHonoEnv,
} from "#operations/interface/http/operations-http-auth"
import {
  mapOperationsError,
  operationsAuthenticatedResponses,
  operationsErrorResponse,
} from "#operations/interface/http/operations-http-support"
import {
  toAdminAnalyticsDto,
  toAdminDashboardDto,
  toAdminLessonAnalyticsPageDto,
} from "#operations/interface/http/operations-http-presenter"

type OperationsReportingRouteDependencies = Readonly<{
  now: () => Date
  queries: OperationsReportingQueries
  session: OperationsAdminSessionPort
}>

export function registerOperationsReportingRoutes<
  TEnv extends OperationsHonoEnv,
>(app: OpenAPIHono<TEnv>, input: OperationsReportingRouteDependencies): void {
  registerDashboardRoute(app, input)
  registerAnalyticsRoute(app, input)
  registerLessonAnalyticsRoute(app, input)
}

function registerDashboardRoute<TEnv extends OperationsHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: OperationsReportingRouteDependencies
): void {
  const route = createRoute({
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
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const result = await input.queries.readDashboard({ now: input.now() })
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(toAdminDashboardDto(result.value), 200)
  })
}

function registerAnalyticsRoute<TEnv extends OperationsHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: OperationsReportingRouteDependencies
): void {
  const route = createRoute({
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
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const query = context.req.valid("query")
    const result = await input.queries.readAnalytics({
      days: query.days,
      now: input.now(),
    })
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(toAdminAnalyticsDto(result.value), 200)
  })
}

function registerLessonAnalyticsRoute<TEnv extends OperationsHonoEnv>(
  app: OpenAPIHono<TEnv>,
  input: OperationsReportingRouteDependencies
): void {
  const route = createRoute({
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
  } satisfies RouteConfig)
  app.openapi(route, async (context) => {
    const result = await input.queries.readLessonAnalytics(
      context.req.valid("query")
    )
    if (result.isErr()) throw mapOperationsError(result.error)
    return context.json(toAdminLessonAnalyticsPageDto(result.value), 200)
  })
}
