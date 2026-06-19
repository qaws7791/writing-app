import type { AnyRouteConfig } from "@workspace/hono/core"
import { adminCourseDetailDtoSchema } from "@workspace/contracts/admin"
import type { AdminService } from "@workspace/core/admin"
import { ErrorResponseSchema } from "@workspace/hono/errors"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import { notFoundAdminError } from "@/errors/admin-errors"
import { adminAuthenticatedResponses, jsonResponse } from "@/http/openapi"
import { createRequireAdminSessionMiddleware } from "@/middleware/admin-auth.middleware"

const courseParamsSchema = z.object({
  courseId: z.string(),
})

export type CurriculumEditorRouteDependencies = {
  readonly adminService: AdminService
  readonly sessionResolver: AdminSessionResolver
}

export function createCurriculumEditorRoutes(
  dependencies: CurriculumEditorRouteDependencies
) {
  return [createGetCourseEditorRoute(dependencies)] as const
}

function createGetCourseEditorRoute({
  adminService,
  sessionResolver,
}: CurriculumEditorRouteDependencies) {
  const routeConfig = {
    method: "get",
    middleware: [createRequireAdminSessionMiddleware(sessionResolver)],
    operationId: "getAdminCourseEditor",
    path: "/courses/{courseId}/editor",
    request: {
      params: courseParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse("어드민 코스 편집 문서입니다.", adminCourseDetailDtoSchema)
      ),
      404: jsonResponse("코스를 찾을 수 없습니다.", ErrorResponseSchema),
    },
    security: [{ adminSessionCookie: [] }],
    summary: "어드민 코스 편집 문서 조회",
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { courseId } = context.req.valid("param")
    const course = await adminService.getCourseEditor({
      courseId,
    })

    if (course === null) {
      throw notFoundAdminError()
    }

    return context.json(course, 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}
