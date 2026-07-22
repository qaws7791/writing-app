import type { AnyRouteConfig } from "@workspace/http-platform/core"
import {
  jsonResponse,
  markdownResponse,
  multipartRequestBody,
} from "@workspace/http-platform/openapi"
import { AppError } from "@workspace/http-platform/errors"
import { z } from "@workspace/http-platform/zod"
import {
  adminImportResourceDocumentRequestSchema,
  adminImportResourceDocumentResultDtoSchema,
  adminResourceDocumentDtoSchema,
  adminResourceImageUploadDtoSchema,
  adminSaveResourceDocumentRequestSchema,
} from "@workspace/contracts/resource-library/admin-resource-documents"
import {
  adminResourceDocumentIdSchema,
  adminResourceImageAltTextSchema,
  adminResourceImageMaxBytes,
} from "@workspace/contracts/resource-library/shared"

import type { ResourceAdminSessionPort } from "#resource-library/application/ports/resource-library-ports"
import type { ResourceAssetApplication } from "#resource-library/application/resource-asset-application"
import type { ResourceDocumentApplication } from "#resource-library/application/resource-document-application"
import type { ResourceDocumentQuery } from "#resource-library/application/resource-library-queries"
import { validateResourceImage } from "#resource-library/domain/resource-asset"
import {
  parseResourceVersionEtag,
  toResourceVersionEtag,
} from "#resource-library/interface/http/resource-library-etag"
import {
  mapResourceLibraryError,
  preconditionRequiredResourceLibraryError,
} from "#resource-library/interface/http/resource-library-http-errors"
import {
  toResourceDocumentDto,
  toResourceTreeNodeDto,
} from "#resource-library/interface/http/resource-library-http-mapper"
import { resourceLibrarySessionRouteOptions } from "#resource-library/interface/http/resource-library-http-auth"
import {
  defineResourceLibraryRoute,
  resourceLibraryAuthenticatedResponses,
  resourceLibraryErrorJsonResponse,
  type ResourceLibraryRouteHandler,
} from "#resource-library/interface/http/resource-library-http-support"

const resourceDocumentParamsSchema = z.object({
  documentId: adminResourceDocumentIdSchema,
})
const ifMatchHeadersSchema = z.object({
  "if-match": z.string().optional(),
})
const resourceImageUploadBodySchema = z.object({
  altText: adminResourceImageAltTextSchema,
  file: z.unknown().openapi({ format: "binary", type: "string" }),
})
const exportedResourceDocumentSchema = z.object({
  fileName: z.string().min(1),
  markdown: z.string(),
})

export type ResourceDocumentRouteDependencies = Readonly<{
  assetApplication: ResourceAssetApplication
  documentApplication: ResourceDocumentApplication
  documentQuery: ResourceDocumentQuery
  sessionPort: ResourceAdminSessionPort
}>

export function createResourceDocumentRoutes(
  dependencies: ResourceDocumentRouteDependencies
) {
  return Object.freeze([
    createGetResourceDocumentRoute(dependencies),
    createSaveResourceDocumentRoute(dependencies),
    createImportResourceDocumentRoute(dependencies),
    createExportResourceDocumentRoute(dependencies),
    createUploadResourceImageRoute(dependencies),
  ])
}

function createUploadResourceImageRoute(
  dependencies: ResourceDocumentRouteDependencies
) {
  const routeConfig = {
    method: "post",
    operationId: "uploadAdminResourceLibraryImage",
    path: "/resources/documents/{documentId}/images",
    request: {
      body: multipartRequestBody(resourceImageUploadBodySchema),
      params: resourceDocumentParamsSchema,
    },
    responses: {
      ...resourceLibraryAuthenticatedResponses(
        jsonResponse(
          "업로드한 자료 이미지입니다.",
          adminResourceImageUploadDtoSchema
        )
      ),
      400: resourceLibraryErrorJsonResponse("지원하지 않는 이미지 파일입니다."),
      404: resourceLibraryErrorJsonResponse("자료실 문서를 찾을 수 없습니다."),
      413: resourceLibraryErrorJsonResponse(
        "이미지 파일 크기가 제한을 초과했습니다."
      ),
      503: resourceLibraryErrorJsonResponse(
        "자료 이미지 저장소를 사용할 수 없습니다."
      ),
    },
    summary: "자료실 이미지 업로드",
    ...resourceLibrarySessionRouteOptions(dependencies.sessionPort),
  } satisfies AnyRouteConfig

  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const { altText, file } = context.req.valid("form")
    if (!(file instanceof File)) throw invalidResourceRequestError()
    if (file.size > adminResourceImageMaxBytes) {
      throw mapResourceLibraryError({
        kind: "resource-validation",
        reason: "image-too-large",
      })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const boundaryValidation = validateResourceImage({ altText, bytes })
    if (boundaryValidation.status === "invalid") {
      throw mapResourceLibraryError({
        kind: "resource-validation",
        reason: boundaryValidation.reason,
      })
    }

    const result = await dependencies.assetApplication.uploadImage({
      actor: context.var.resourceActor,
      altText,
      bytes,
      documentId: context.req.valid("param").documentId,
    })
    if (result.kind !== "ok") throw mapResourceLibraryError(result)

    return context.json(
      adminResourceImageUploadDtoSchema.parse({
        altText: result.value.asset.altText,
        byteSize: result.value.asset.byteSize,
        contentType: result.value.asset.contentType,
        id: result.value.asset.id,
        url: result.value.url,
      }),
      200
    )
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function createGetResourceDocumentRoute(
  dependencies: ResourceDocumentRouteDependencies
) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminResourceLibraryDocument",
    path: "/resources/documents/{documentId}",
    request: { params: resourceDocumentParamsSchema },
    responses: {
      ...resourceLibraryAuthenticatedResponses(
        jsonResponse(
          "자료실 Markdown 문서입니다.",
          adminResourceDocumentDtoSchema
        )
      ),
      404: resourceLibraryErrorJsonResponse("자료실 문서를 찾을 수 없습니다."),
    },
    summary: "자료실 Markdown 문서 조회",
    ...resourceLibrarySessionRouteOptions(dependencies.sessionPort),
  } satisfies AnyRouteConfig
  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const document = await dependencies.documentQuery.readDocument(
      context.req.valid("param").documentId
    )
    if (document === null) {
      throw mapResourceLibraryError({
        kind: "resource-not-found",
        target: "document",
      })
    }
    const response = adminResourceDocumentDtoSchema.parse(
      toResourceDocumentDto(document)
    )
    return context.json(response, 200, {
      ETag: toResourceVersionEtag(response.version),
    })
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function createSaveResourceDocumentRoute(
  dependencies: ResourceDocumentRouteDependencies
) {
  const routeConfig = {
    method: "put",
    operationId: "saveAdminResourceLibraryDocument",
    path: "/resources/documents/{documentId}",
    request: {
      body: {
        content: {
          "application/json": {
            schema: adminSaveResourceDocumentRequestSchema,
          },
        },
      },
      headers: ifMatchHeadersSchema,
      params: resourceDocumentParamsSchema,
    },
    responses: {
      ...resourceLibraryAuthenticatedResponses(
        jsonResponse(
          "저장한 자료실 문서입니다.",
          adminResourceDocumentDtoSchema
        )
      ),
      400: resourceLibraryErrorJsonResponse("유효하지 않은 자료실 문서입니다."),
      404: resourceLibraryErrorJsonResponse("자료실 문서를 찾을 수 없습니다."),
      409: resourceLibraryErrorJsonResponse("자료실 이름 충돌이 발생했습니다."),
      412: jsonResponse(
        "다른 탭이나 기기에서 먼저 저장한 최신 문서입니다.",
        adminResourceDocumentDtoSchema
      ),
      428: resourceLibraryErrorJsonResponse("If-Match 문서 버전이 필요합니다."),
      503: resourceLibraryErrorJsonResponse(
        "자료실 저장소를 사용할 수 없습니다."
      ),
    },
    summary: "자료실 제목과 Markdown 조건부 저장",
    ...resourceLibrarySessionRouteOptions(dependencies.sessionPort),
  } satisfies AnyRouteConfig
  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const ifMatch = context.req.valid("header")["if-match"]
    if (ifMatch === undefined) {
      throw preconditionRequiredResourceLibraryError()
    }
    const expectedVersion = parseResourceVersionEtag(ifMatch)
    if (expectedVersion === null) throw invalidResourceRequestError()

    const request = context.req.valid("json")
    const result = await dependencies.documentApplication.saveDocument({
      actor: context.var.resourceActor,
      contentMarkdown: request.contentMarkdown,
      documentId: context.req.valid("param").documentId,
      expectedVersion,
      name: request.name,
    })
    if (
      result.kind === "resource-conflict" &&
      result.reason === "stale-version" &&
      result.document !== undefined
    ) {
      const latest = adminResourceDocumentDtoSchema.parse(
        toResourceDocumentDto(result.document)
      )
      return context.json(latest, 412, {
        ETag: toResourceVersionEtag(latest.version),
      })
    }
    if (result.kind !== "ok") throw mapResourceLibraryError(result)

    const saved = adminResourceDocumentDtoSchema.parse(
      toResourceDocumentDto(result.value)
    )
    return context.json(saved, 200, {
      ETag: toResourceVersionEtag(saved.version),
    })
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function createImportResourceDocumentRoute(
  dependencies: ResourceDocumentRouteDependencies
) {
  const routeConfig = {
    method: "post",
    operationId: "importAdminResourceLibraryDocument",
    path: "/resources/documents/import",
    request: {
      body: {
        content: {
          "application/json": {
            schema: adminImportResourceDocumentRequestSchema,
          },
        },
      },
    },
    responses: {
      ...resourceLibraryAuthenticatedResponses(
        jsonResponse(
          "가져온 자료실 Markdown 문서입니다.",
          adminImportResourceDocumentResultDtoSchema
        )
      ),
      400: resourceLibraryErrorJsonResponse(
        "유효하지 않은 Markdown 문서입니다."
      ),
      404: resourceLibraryErrorJsonResponse("대상 폴더를 찾을 수 없습니다."),
      409: resourceLibraryErrorJsonResponse("자료실 이름 충돌이 발생했습니다."),
      422: resourceLibraryErrorJsonResponse("자료실 항목 한도를 초과했습니다."),
      503: resourceLibraryErrorJsonResponse(
        "자료실 저장소를 사용할 수 없습니다."
      ),
    },
    summary: "자료실 Markdown 단일 파일 가져오기",
    ...resourceLibrarySessionRouteOptions(dependencies.sessionPort),
  } satisfies AnyRouteConfig
  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const request = context.req.valid("json")
    const result = await dependencies.documentApplication.importDocument({
      actor: context.var.resourceActor,
      fileName: request.fileName,
      markdown: request.markdown,
      parentId: request.parentId,
    })
    if (result.kind !== "ok") throw mapResourceLibraryError(result)
    return context.json(
      adminImportResourceDocumentResultDtoSchema.parse({
        document: toResourceDocumentDto(result.value.document),
        mutation: {
          node: toResourceTreeNodeDto(result.value.node, false),
        },
      }),
      200
    )
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function createExportResourceDocumentRoute(
  dependencies: ResourceDocumentRouteDependencies
) {
  const routeConfig = {
    method: "get",
    operationId: "exportAdminResourceLibraryDocument",
    path: "/resources/documents/{documentId}/export",
    request: { params: resourceDocumentParamsSchema },
    responses: {
      ...resourceLibraryAuthenticatedResponses(
        markdownResponse("내보낸 자료실 Markdown 문서입니다.")
      ),
      404: resourceLibraryErrorJsonResponse("자료실 문서를 찾을 수 없습니다."),
    },
    summary: "자료실 Markdown 문서 내보내기",
    ...resourceLibrarySessionRouteOptions(dependencies.sessionPort),
  } satisfies AnyRouteConfig
  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const result = await dependencies.documentApplication.exportDocument(
      context.req.valid("param").documentId
    )
    if (result.kind !== "ok") throw mapResourceLibraryError(result)
    const document = exportedResourceDocumentSchema.parse(result.value)
    return context.body(document.markdown, 200, {
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
      "Content-Type": "text/markdown; charset=UTF-8",
    })
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function invalidResourceRequestError(): AppError {
  return new AppError({
    code: "INVALID_REQUEST",
    message: "Invalid request",
    status: 400,
  })
}
