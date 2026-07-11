import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminArchiveCourseResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseListDtoSchema,
  adminCourseListStatusFilterSchema,
} from "@workspace/contracts/admin"
import type { AdminCourseUseCase } from "@workspace/core/admin"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import { unwrapAdminOwnerMutationResult } from "@/errors/admin-errors"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonResponse,
} from "@/http/openapi"
import {
  adminSessionRouteOptions,
  ownerAdminRouteOptions,
} from "@/routes/admin-route-options"
import { positiveIntegerQuery } from "@/routes/query-schemas"

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

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) =>
    context.json(
      await courseService.getCourses(context.req.valid("query")),
      200
    )

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
    return context.json(unwrapAdminOwnerMutationResult(result), 200)
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
    return context.json(unwrapAdminOwnerMutationResult(result), 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}
