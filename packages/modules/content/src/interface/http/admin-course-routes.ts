import {
  createRoute,
  type OpenAPIHono,
  type RouteConfig,
} from "@hono/zod-openapi"
import { jsonResponse } from "@workspace/http-platform/openapi"
import {
  adminArchiveCourseResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseListDtoSchema,
} from "@workspace/contracts/content/admin-courses"
import {
  adminCourseParamsSchema,
  adminCoursesQuerySchema,
} from "@workspace/contracts/content/admin-routes"

import type { ContentApplication } from "#content/application/content-application"
import type { ContentAdminSessionPort } from "#content/application/ports/content-ports"
import { contentSessionRouteOptions } from "#content/interface/http/content-http-auth"
import { mapContentError } from "#content/interface/http/content-http-errors"
import {
  toAdminCourseDetail,
  toAdminCourseList,
} from "#content/interface/http/content-http-mapper"
import {
  contentAuthenticatedResponses,
  contentErrorJsonResponse,
} from "#content/interface/http/content-http-support"
import type { ContentAdminHonoEnv } from "#content/interface/http/content-http-auth"

export type AdminCourseRouteDependencies = Readonly<{
  application: ContentApplication
  sessionPort: ContentAdminSessionPort
}>

export function registerAdminCourseRoutes<TEnv extends ContentAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  dependencies: AdminCourseRouteDependencies
): void {
  registerListCoursesRoute(app, dependencies)
  registerCreateCourseRoute(app, dependencies)
  registerArchiveCourseRoute(app, dependencies)
}

function registerListCoursesRoute<TEnv extends ContentAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { application, sessionPort }: AdminCourseRouteDependencies
): void {
  const routeConfig = {
    method: "get",
    operationId: "getAdminCourses",
    path: "/courses",
    request: { query: adminCoursesQuerySchema },
    responses: contentAuthenticatedResponses(
      jsonResponse("어드민 코스 목록입니다.", adminCourseListDtoSchema)
    ),
    summary: "어드민 코스 목록 조회",
    ...contentSessionRouteOptions(sessionPort),
  } satisfies RouteConfig
  const route = createRoute(routeConfig)

  app.openapi(route, async (context) => {
    const page = await application.getCourses(context.req.valid("query"))
    return context.json(toAdminCourseList(page), 200)
  })
}

function registerCreateCourseRoute<TEnv extends ContentAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { application, sessionPort }: AdminCourseRouteDependencies
): void {
  const routeConfig = {
    method: "post",
    operationId: "createAdminCourse",
    path: "/courses",
    responses: contentAuthenticatedResponses(
      jsonResponse("생성된 어드민 코스입니다.", adminCourseDetailDtoSchema)
    ),
    summary: "어드민 코스 생성",
    ...contentSessionRouteOptions(sessionPort),
  } satisfies RouteConfig
  const route = createRoute(routeConfig)

  app.openapi(route, async (context) => {
    const result = await application.createCourse(context.var.contentAdminId)
    if (result.isErr()) throw mapContentError(result.error)
    return context.json(toAdminCourseDetail(result.value), 200)
  })
}

function registerArchiveCourseRoute<TEnv extends ContentAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { application, sessionPort }: AdminCourseRouteDependencies
): void {
  const routeConfig = {
    method: "delete",
    operationId: "archiveAdminCourse",
    path: "/courses/{courseId}",
    request: { params: adminCourseParamsSchema },
    responses: {
      ...contentAuthenticatedResponses(
        jsonResponse(
          "보관된 어드민 코스 결과입니다.",
          adminArchiveCourseResultSchema
        )
      ),
      404: contentErrorJsonResponse("코스를 찾을 수 없습니다."),
      409: contentErrorJsonResponse("코스 상태 변경이 충돌했습니다."),
    },
    summary: "어드민 코스 보관",
    ...contentSessionRouteOptions(sessionPort),
  } satisfies RouteConfig
  const route = createRoute(routeConfig)

  app.openapi(route, async (context) => {
    const result = await application.archiveCourse({
      adminId: context.var.contentAdminId,
      courseId: context.req.valid("param").courseId,
    })
    if (result.isErr()) throw mapContentError(result.error)
    return context.json(
      adminArchiveCourseResultSchema.parse({ archived: true }),
      200
    )
  })
}
