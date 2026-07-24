import {
  createRoute,
  type OpenAPIHono,
  type RouteConfig,
} from "@hono/zod-openapi"
import {
  jsonResponse,
  multipartRequestBody,
} from "@workspace/http-platform/openapi"
import {
  adminContentAssetAltTextSchema,
  adminContentAssetKindSchema,
  adminContentAssetMaxBytes,
  adminContentAssetUploadDtoSchema,
} from "@workspace/contracts/content/admin-assets"
import {
  courseIdSchema,
  curriculumVersionIdSchema,
} from "@workspace/contracts/content/ids"
import { z } from "@workspace/http-platform/openapi"

import type { ContentApplication } from "#content/application/content-application"
import type { ContentAdminSessionPort } from "#content/application/ports/content-ports"
import { contentSessionRouteOptions } from "#content/interface/http/content-http-auth"
import {
  invalidContentRequestError,
  mapContentError,
} from "#content/interface/http/content-http-errors"
import {
  contentAuthenticatedResponses,
  contentErrorJsonResponse,
} from "#content/interface/http/content-http-support"
import type { ContentAdminHonoEnv } from "#content/interface/http/content-http-auth"

const contentAssetParamsSchema = z.object({
  courseId: courseIdSchema,
})

const contentAssetUploadBodySchema = z.object({
  altText: adminContentAssetAltTextSchema,
  curriculumVersionId: curriculumVersionIdSchema,
  file: z
    .custom<File>((value) => value instanceof File)
    .openapi({ format: "binary", type: "string" }),
  kind: adminContentAssetKindSchema,
})

type AdminContentAssetRouteDependencies = Readonly<{
  application: ContentApplication
  sessionPort: ContentAdminSessionPort
}>

export function registerAdminContentAssetRoutes<
  TEnv extends ContentAdminHonoEnv,
>(
  app: OpenAPIHono<TEnv>,
  dependencies: AdminContentAssetRouteDependencies
): void {
  registerUploadContentAssetRoute(app, dependencies)
}

function registerUploadContentAssetRoute<TEnv extends ContentAdminHonoEnv>(
  app: OpenAPIHono<TEnv>,
  { application, sessionPort }: AdminContentAssetRouteDependencies
): void {
  const routeConfig = {
    method: "post",
    operationId: "uploadAdminContentAsset",
    path: "/courses/{courseId}/assets",
    request: {
      body: multipartRequestBody(contentAssetUploadBodySchema),
      params: contentAssetParamsSchema,
    },
    responses: {
      ...contentAuthenticatedResponses(
        jsonResponse(
          "업로드한 콘텐츠 이미지입니다.",
          adminContentAssetUploadDtoSchema
        )
      ),
      400: contentErrorJsonResponse("지원하지 않는 콘텐츠 이미지입니다."),
      404: contentErrorJsonResponse(
        "코스 또는 편집 중인 curriculum version을 찾을 수 없습니다."
      ),
      409: contentErrorJsonResponse(
        "발행된 curriculum version의 asset은 변경할 수 없습니다."
      ),
      413: contentErrorJsonResponse(
        "콘텐츠 이미지 파일 크기가 제한을 초과했습니다."
      ),
      503: contentErrorJsonResponse(
        "콘텐츠 이미지 저장소를 사용할 수 없습니다."
      ),
    },
    summary: "코스 콘텐츠 이미지 업로드",
    ...contentSessionRouteOptions(sessionPort),
  } satisfies RouteConfig
  const route = createRoute(routeConfig)

  app.openapi(route, async (context) => {
    const form = context.req.valid("form")
    if (!(form.file instanceof File)) throw invalidContentRequestError()
    if (form.file.size > adminContentAssetMaxBytes) {
      throw mapContentError({
        kind: "content-asset-invalid",
        reason: "image-too-large",
      })
    }

    const result = await application.uploadAsset({
      adminId: context.var.contentAdminId,
      altText: form.altText,
      bytes: new Uint8Array(await form.file.arrayBuffer()),
      courseId: context.req.valid("param").courseId,
      curriculumVersionId: form.curriculumVersionId,
      declaredContentType: form.file.type,
      kind: form.kind,
    })
    if (result.isErr()) throw mapContentError(result.error)

    return context.json(
      adminContentAssetUploadDtoSchema.parse({
        altText: result.value.asset.altText,
        byteSize: result.value.asset.byteSize,
        contentType: result.value.asset.contentType,
        courseId: result.value.asset.courseId,
        curriculumVersionId: result.value.asset.curriculumVersionId,
        id: result.value.asset.id,
        kind: result.value.asset.kind,
        url: result.value.url,
      }),
      200
    )
  })
}
