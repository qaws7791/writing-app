import type { AnyRouteConfig } from "@workspace/http-platform/core"
import {
  adminCourseEditorDocumentSchema,
  adminPublishCourseResultSchema,
} from "@workspace/contracts/content/admin-data"
import { courseIdSchema } from "@workspace/contracts/content/ids"
import type { AdminCourseUseCase } from "@workspace/core/content"
import { z } from "@workspace/http-platform/zod"

import type { AdminSessionResolver } from "@workspace/auth/admin/server"
import {
  defineAdminRoute,
  type AdminRouteHandler,
} from "@/admin/admin-hono-env"
import {
  invalidAdminRequestError,
  notFoundAdminError,
  preconditionRequiredAdminError,
  unwrapAdminCourseEditorSaveResult,
  unwrapAdminCoursePublishResult,
} from "@/admin/admin-errors"
import {
  parseIntegerEtag,
  toIntegerEtag,
} from "@/modules/admin-content/admin-integer-etag"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonResponse,
} from "@/admin/admin-openapi"
import {
  adminSessionRouteOptions,
  ownerAdminRouteOptions,
} from "@/admin/admin-route-options"

const courseParamsSchema = z.object({
  courseId: courseIdSchema,
})
const ifMatchHeadersSchema = z.object({
  "if-match": z.string().optional(),
})

export type CurriculumEditorRouteDependencies = {
  readonly courseService: AdminCourseUseCase
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createCurriculumEditorRoutes(
  dependencies: CurriculumEditorRouteDependencies
) {
  return [
    createGetCourseEditorRoute(dependencies),
    createSaveCourseEditorRoute(dependencies),
    createPublishCourseRoute(dependencies),
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

    const response = adminCourseEditorDocumentSchema.parse(course)

    return context.json(response, 200, {
      ETag: toIntegerEtag(response.editVersion),
    })
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createSaveCourseEditorRoute({
  courseService,
  now,
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
      headers: ifMatchHeadersSchema,
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
      428: errorJsonResponse("If-Match draft version이 필요합니다."),
    },
    summary: "어드민 코스 편집 문서 저장",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { courseId } = context.req.valid("param")
    const document = context.req.valid("json")
    const ifMatch = context.req.valid("header")["if-match"]
    if (ifMatch === undefined) throw preconditionRequiredAdminError()
    const expectedEditVersion = parseIntegerEtag(ifMatch)
    if (expectedEditVersion === null) throw invalidAdminRequestError()
    if (courseId !== document.id) throw invalidAdminRequestError()

    const result = await courseService.saveCourseEditor({
      actor: context.var.adminActor,
      courseId,
      document,
      expectedEditVersion,
      now: now(),
    })
    const saved = adminCourseEditorDocumentSchema.parse(
      unwrapAdminCourseEditorSaveResult(result)
    )
    return context.json(saved, 200, {
      ETag: toIntegerEtag(saved.editVersion),
    })
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function createPublishCourseRoute({
  courseService,
  now,
  sessionResolver,
}: CurriculumEditorRouteDependencies) {
  const routeConfig = {
    method: "post",
    operationId: "publishAdminCourse",
    path: "/courses/{courseId}/publish",
    request: {
      headers: ifMatchHeadersSchema,
      params: courseParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "게시된 커리큘럼 버전입니다.",
          adminPublishCourseResultSchema
        )
      ),
      400: errorJsonResponse("If-Match 형식이 유효하지 않습니다."),
      404: errorJsonResponse("코스 draft를 찾을 수 없습니다."),
      409: errorJsonResponse("코스 draft version이 충돌했습니다."),
      422: errorJsonResponse("게시 조건을 만족하지 않는 draft입니다."),
      428: errorJsonResponse("If-Match draft version이 필요합니다."),
    },
    summary: "어드민 코스 draft 게시",
    ...ownerAdminRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const ifMatch = context.req.valid("header")["if-match"]
    if (ifMatch === undefined) throw preconditionRequiredAdminError()
    const expectedEditVersion = parseIntegerEtag(ifMatch)
    if (expectedEditVersion === null) throw invalidAdminRequestError()
    const { courseId } = context.req.valid("param")
    const result = await courseService.publishCourse({
      actor: context.var.adminActor,
      courseId,
      expectedEditVersion,
      now: now(),
    })
    const published = adminPublishCourseResultSchema.parse(
      unwrapAdminCoursePublishResult(result)
    )

    return context.json(published, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}
