import type { AnyRouteConfig } from "@workspace/hono/core"
import { adminCourseEditorDocumentSchema } from "@workspace/contracts/admin"
import { courseIdSchema } from "@workspace/contracts/content"
import type { AdminCourseUseCase } from "@workspace/core/admin"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import {
  invalidAdminRequestError,
  notFoundAdminError,
  unwrapAdminCourseEditorSaveResult,
} from "@/errors/admin-errors"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonResponse,
} from "@/http/openapi"
import {
  adminSessionRouteOptions,
  ownerAdminRouteOptions,
} from "@/routes/admin-route-options"

const courseParamsSchema = z.object({
  courseId: courseIdSchema,
})

export type CurriculumEditorRouteDependencies = {
  readonly courseService: AdminCourseUseCase
  readonly sessionResolver: AdminSessionResolver
}

export function createCurriculumEditorRoutes(
  dependencies: CurriculumEditorRouteDependencies
) {
  return [
    createGetCourseEditorRoute(dependencies),
    createSaveCourseEditorRoute(dependencies),
  ] as const
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
        jsonResponse(
          "어드민 코스 편집 문서입니다.",
          adminCourseEditorDocumentSchema
        )
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

function createSaveCourseEditorRoute({
  courseService,
  sessionResolver,
}: CurriculumEditorRouteDependencies) {
  const routeConfig = {
    method: "put",
    operationId: "saveAdminCourseEditor",
    path: "/courses/{courseId}/editor",
    request: {
      body: {
        content: {
          "application/json": { schema: adminCourseEditorDocumentSchema },
        },
        required: true,
      },
      params: courseParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "저장된 어드민 코스 편집 문서입니다.",
          adminCourseEditorDocumentSchema
        )
      ),
      400: errorJsonResponse("코스 편집 문서가 유효하지 않습니다."),
      404: errorJsonResponse("코스를 찾을 수 없습니다."),
      409: errorJsonResponse("코스 편집 revision이 충돌했습니다."),
    },
    summary: "어드민 코스 편집 문서 저장",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { courseId } = context.req.valid("param")
    const document = context.req.valid("json")
    if (courseId !== document.id) throw invalidAdminRequestError()

    const result = await courseService.saveCourseEditor({
      actor: context.var.adminActor,
      courseId,
      document,
    })
    return context.json(unwrapAdminCourseEditorSaveResult(result), 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}
