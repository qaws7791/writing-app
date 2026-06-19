import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminArchiveCourseResultSchema,
  adminCourseDetailDtoSchema,
  adminCourseListDtoSchema,
  adminCourseListStatusFilterSchema,
} from "@workspace/contracts/admin"
import { type AdminService } from "@workspace/core/admin"
import { ErrorResponseSchema } from "@workspace/hono/errors"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import { notFoundAdminError } from "@/errors/admin-errors"
import { adminAuthenticatedResponses, jsonResponse } from "@/http/openapi"
import {
  createRequireAdminSessionMiddleware,
  createRequireOwnerAdminSessionMiddleware,
} from "@/middleware/admin-auth.middleware"
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
  readonly adminService: AdminService
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
  adminService,
  sessionResolver,
}: CoursesRouteDependencies) {
  const routeConfig = {
    method: "get",
    middleware: [createRequireAdminSessionMiddleware(sessionResolver)],
    operationId: "getAdminCourses",
    path: "/courses",
    request: {
      query: coursesQuerySchema,
    },
    responses: adminAuthenticatedResponses(
      jsonResponse("어드민 코스 목록입니다.", adminCourseListDtoSchema)
    ),
    security: [{ adminSessionCookie: [] }],
    summary: "어드민 코스 목록 조회",
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) =>
    context.json(await adminService.getCourses(context.req.valid("query")), 200)

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createCreateCourseRoute({
  adminService,
  now,
  sessionResolver,
}: CoursesRouteDependencies) {
  const routeConfig = {
    method: "post",
    middleware: [createRequireOwnerAdminSessionMiddleware(sessionResolver)],
    operationId: "createAdminCourse",
    path: "/courses",
    responses: adminAuthenticatedResponses(
      jsonResponse("생성된 어드민 코스입니다.", adminCourseDetailDtoSchema)
    ),
    security: [{ adminSessionCookie: [] }],
    summary: "어드민 코스 생성",
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) =>
    context.json(
      await adminService.createCourse({
        now: now(),
      }),
      200
    )

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createArchiveCourseRoute({
  adminService,
  now,
  sessionResolver,
}: CoursesRouteDependencies) {
  const routeConfig = {
    method: "delete",
    middleware: [createRequireOwnerAdminSessionMiddleware(sessionResolver)],
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
      404: jsonResponse("코스를 찾을 수 없습니다.", ErrorResponseSchema),
    },
    security: [{ adminSessionCookie: [] }],
    summary: "어드민 코스 보관",
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { courseId } = context.req.valid("param")
    const result = await adminService.archiveCourse({
      courseId,
      now: now(),
    })

    if (result === null) {
      throw notFoundAdminError()
    }

    return context.json(result, 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}
