import type { AnyRouteConfig } from "@workspace/hono/core"
import { adminCourseDetailDtoSchema } from "@workspace/contracts/admin"
import type { AdminCourseUseCase } from "@workspace/core/admin"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import { notFoundAdminError } from "@/errors/admin-errors"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonResponse,
} from "@/http/openapi"
import { adminSessionRouteOptions } from "@/routes/admin-route-options"

const courseParamsSchema = z.object({
  courseId: z.string(),
})

export type CurriculumEditorRouteDependencies = {
  readonly courseService: AdminCourseUseCase
  readonly sessionResolver: AdminSessionResolver
}

export function createCurriculumEditorRoutes(
  dependencies: CurriculumEditorRouteDependencies
) {
  return [createGetCourseEditorRoute(dependencies)] as const
}

function createGetCourseEditorRoute({
  courseService,
  sessionResolver,
}: CurriculumEditorRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminCourseEditor",
    path: "/courses/{courseId}/editor",
    request: {
      params: courseParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse("어드민 코스 편집 문서입니다.", adminCourseDetailDtoSchema)
      ),
      404: errorJsonResponse("코스를 찾을 수 없습니다."),
    },
    summary: "어드민 코스 편집 문서 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { courseId } = context.req.valid("param")
    const course = await courseService.getCourseEditor({
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
