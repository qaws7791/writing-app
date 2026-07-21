import type { AnyRouteConfig } from "@/http/platform/core"
import {
  adminArchiveCourseResultSchema,
  adminCourseListDtoSchema,
} from "@workspace/contracts/admin/admin-courses"
import {
  adminCourseDetailDtoSchema,
  adminCourseListStatusFilterSchema,
} from "@workspace/contracts/admin/content-data"
import type {
  AdminCourseArchiveResult,
  AdminCourseListResult,
  AdminCourseUseCase,
} from "@workspace/core/content"
import { z } from "@/http/platform/zod"

import type { AdminSessionResolver } from "@workspace/auth/admin/server"
import {
  defineAdminRoute,
  type AdminRouteHandler,
} from "@/admin/admin-hono-env"
import {
  forbiddenAdminError,
  notFoundAdminError,
  unwrapAdminOwnerMutationResult,
} from "@/admin/admin-errors"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonResponse,
} from "@/admin/admin-openapi"
import {
  adminSessionRouteOptions,
  ownerAdminRouteOptions,
} from "@/admin/admin-route-options"
import { positiveIntegerQuery } from "@/modules/admin-content/admin-query-schemas"

const defaultPage = 1
const defaultPageSize = 20
const maxPageSize = 100

const coursesQuerySchema = z.object({
  category: z.string().optional().default(""),
  page: positiveIntegerQuery({
    fallback: defaultPage,
  }),
  pageSize: positiveIntegerQuery({
    fallback: defaultPageSize,
    max: maxPageSize,
  }),
  query: z.string().optional().default(""),
  status: adminCourseListStatusFilterSchema.optional().default("all"),
})

const courseParamsSchema = z.object({
  courseId: z.string(),
})

export type CoursesRouteDependencies = {
  readonly courseService: AdminCourseUseCase
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createCoursesRoutes(dependencies: CoursesRouteDependencies) {
  return [
    createListCoursesRoute(dependencies),
    createCreateCourseRoute(dependencies),
    createArchiveCourseRoute(dependencies),
  ] as const
}

function createListCoursesRoute({
  courseService,
  sessionResolver,
}: CoursesRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminCourses",
    path: "/courses",
    request: {
      query: coursesQuerySchema,
    },
    responses: adminAuthenticatedResponses(
      jsonResponse("어드민 코스 목록입니다.", adminCourseListDtoSchema)
    ),
    summary: "어드민 코스 목록 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const query = context.req.valid("query")
    const result = await courseService.getCourses({
      category: query.category,
      page: query.page,
      pageSize: query.pageSize,
      query: query.query,
      status: query.status,
    })

    return context.json(toAdminCourseListResponse(result), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createCreateCourseRoute({
  courseService,
  now,
  sessionResolver,
}: CoursesRouteDependencies) {
  const routeConfig = {
    method: "post",
    operationId: "createAdminCourse",
    path: "/courses",
    responses: adminAuthenticatedResponses(
      jsonResponse("생성된 어드민 코스입니다.", adminCourseDetailDtoSchema)
    ),
    summary: "어드민 코스 생성",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const result = await courseService.createCourse({
      actor: context.var.adminActor,
      now: now(),
    })
    const course = adminCourseDetailDtoSchema.parse(
      unwrapAdminOwnerMutationResult(result)
    )

    return context.json(course, 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createArchiveCourseRoute({
  courseService,
  now,
  sessionResolver,
}: CoursesRouteDependencies) {
  const routeConfig = {
    method: "delete",
    operationId: "archiveAdminCourse",
    path: "/courses/{courseId}",
    request: {
      params: courseParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "보관된 어드민 코스 결과입니다.",
          adminArchiveCourseResultSchema
        )
      ),
      404: errorJsonResponse("코스를 찾을 수 없습니다."),
    },
    summary: "어드민 코스 보관",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { courseId } = context.req.valid("param")
    const result = await courseService.archiveCourse({
      actor: context.var.adminActor,
      courseId,
      now: now(),
    })

    return context.json(toArchiveCourseResponse(result), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function toAdminCourseListResponse(result: AdminCourseListResult) {
  return adminCourseListDtoSchema.parse({
    items: result.items,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    },
  })
}

function toArchiveCourseResponse(result: AdminCourseArchiveResult) {
  switch (result.kind) {
    case "forbidden":
      throw forbiddenAdminError()
    case "not-found":
      throw notFoundAdminError()
    case "ok":
      return adminArchiveCourseResultSchema.parse({ archived: true })
  }
}
