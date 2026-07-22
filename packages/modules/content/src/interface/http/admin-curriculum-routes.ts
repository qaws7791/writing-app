import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { jsonResponse } from "@workspace/http-platform/openapi"
import {
  adminCourseEditorDocumentSchema,
  adminPublishCourseResultSchema,
} from "@workspace/contracts/content/admin-courses"
import {
  adminCourseIfMatchHeadersSchema,
  adminCourseParamsSchema,
} from "@workspace/contracts/content/admin-routes"

import type { ContentApplication } from "#content/application/content-application"
import type { ContentAdminSessionPort } from "#content/application/ports/content-ports"
import {
  contentMutationRouteOptions,
  contentSessionRouteOptions,
} from "#content/interface/http/content-http-auth"
import {
  contentPreconditionRequiredError,
  invalidContentRequestError,
  mapContentError,
} from "#content/interface/http/content-http-errors"
import {
  toAdminCourseEditorDocument,
  toAdminPublishResult,
  toCourseEditorDocument,
} from "#content/interface/http/content-http-mapper"
import {
  contentAuthenticatedResponses,
  contentErrorJsonResponse,
  defineContentRoute,
  type ContentRouteHandler,
} from "#content/interface/http/content-http-support"
import {
  parseIntegerEtag,
  toIntegerEtag,
} from "#content/interface/http/content-etag"

export type AdminCurriculumRouteDependencies = Readonly<{
  application: ContentApplication
  sessionPort: ContentAdminSessionPort
}>

export function createAdminCurriculumRoutes(
  dependencies: AdminCurriculumRouteDependencies
) {
  return Object.freeze([
    createGetCourseEditorRoute(dependencies),
    createSaveCourseEditorRoute(dependencies),
    createPublishCourseRoute(dependencies),
  ])
}

function createGetCourseEditorRoute({
  application,
  sessionPort,
}: AdminCurriculumRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminCourseEditor",
    path: "/courses/{courseId}/editor",
    request: { params: adminCourseParamsSchema },
    responses: {
      ...contentAuthenticatedResponses(
        jsonResponse(
          "어드민 코스 편집 문서입니다.",
          adminCourseEditorDocumentSchema
        )
      ),
      404: contentErrorJsonResponse("코스를 찾을 수 없습니다."),
    },
    summary: "어드민 코스 편집 문서 조회",
    ...contentSessionRouteOptions(sessionPort),
  } satisfies AnyRouteConfig

  const handler: ContentRouteHandler<typeof routeConfig> = async (context) => {
    const document = await application.getCourseEditor(
      context.req.valid("param").courseId
    )
    if (document === null) throw mapContentError({ kind: "content-not-found" })

    const response = toAdminCourseEditorDocument(document)
    return context.json(response, 200, {
      ETag: toIntegerEtag(response.editVersion),
    })
  }

  return defineContentRoute({ ...routeConfig, handler })
}

function createSaveCourseEditorRoute({
  application,
  sessionPort,
}: AdminCurriculumRouteDependencies) {
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
      headers: adminCourseIfMatchHeadersSchema,
      params: adminCourseParamsSchema,
    },
    responses: {
      ...contentAuthenticatedResponses(
        jsonResponse(
          "저장된 어드민 코스 편집 문서입니다.",
          adminCourseEditorDocumentSchema
        )
      ),
      400: contentErrorJsonResponse("코스 편집 문서가 유효하지 않습니다."),
      404: contentErrorJsonResponse("코스를 찾을 수 없습니다."),
      409: contentErrorJsonResponse("코스 편집 revision이 충돌했습니다."),
      422: contentErrorJsonResponse("콘텐츠 invariant를 만족하지 않습니다."),
      428: contentErrorJsonResponse("If-Match draft version이 필요합니다."),
    },
    summary: "어드민 코스 편집 문서 저장",
    ...contentMutationRouteOptions(sessionPort),
  } satisfies AnyRouteConfig

  const handler: ContentRouteHandler<typeof routeConfig> = async (context) => {
    const expectedEditVersion = readExpectedEditVersion(
      context.req.valid("header")["if-match"]
    )
    const params = context.req.valid("param")
    const requestDocument = context.req.valid("json")
    if (params.courseId !== requestDocument.id) {
      throw invalidContentRequestError()
    }

    const document = toCourseEditorDocument(requestDocument)
    if (document.isErr()) throw mapContentError(document.error)
    const result = await application.saveCourseEditor({
      actor: context.var.contentActor,
      document: document.value,
      expectedEditVersion,
    })
    if (result.isErr()) throw mapContentError(result.error)

    const response = toAdminCourseEditorDocument(result.value)
    return context.json(response, 200, {
      ETag: toIntegerEtag(response.editVersion),
    })
  }

  return defineContentRoute({ ...routeConfig, handler })
}

function createPublishCourseRoute({
  application,
  sessionPort,
}: AdminCurriculumRouteDependencies) {
  const routeConfig = {
    method: "post",
    operationId: "publishAdminCourse",
    path: "/courses/{courseId}/publish",
    request: {
      headers: adminCourseIfMatchHeadersSchema,
      params: adminCourseParamsSchema,
    },
    responses: {
      ...contentAuthenticatedResponses(
        jsonResponse(
          "게시된 커리큘럼 버전입니다.",
          adminPublishCourseResultSchema
        )
      ),
      400: contentErrorJsonResponse("If-Match 형식이 유효하지 않습니다."),
      404: contentErrorJsonResponse("코스 draft를 찾을 수 없습니다."),
      409: contentErrorJsonResponse("코스 draft version이 충돌했습니다."),
      422: contentErrorJsonResponse("게시 조건을 만족하지 않는 draft입니다."),
      428: contentErrorJsonResponse("If-Match draft version이 필요합니다."),
    },
    summary: "어드민 코스 draft 게시",
    ...contentMutationRouteOptions(sessionPort),
  } satisfies AnyRouteConfig

  const handler: ContentRouteHandler<typeof routeConfig> = async (context) => {
    const expectedEditVersion = readExpectedEditVersion(
      context.req.valid("header")["if-match"]
    )
    const result = await application.publishCourse({
      actor: context.var.contentActor,
      courseId: context.req.valid("param").courseId,
      expectedEditVersion,
    })
    if (result.isErr()) throw mapContentError(result.error)
    return context.json(toAdminPublishResult(result.value), 200)
  }

  return defineContentRoute({ ...routeConfig, handler })
}

function readExpectedEditVersion(value: string | undefined): number {
  if (value === undefined) throw contentPreconditionRequiredError()
  const version = parseIntegerEtag(value)
  if (version === null) throw invalidContentRequestError()
  return version
}
