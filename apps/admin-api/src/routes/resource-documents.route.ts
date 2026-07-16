import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminImportResourceDocumentRequestSchema,
  adminImportResourceDocumentResultDtoSchema,
  adminResourceDocumentDtoSchema,
  adminResourceImageAltTextSchema,
  adminResourceImageMaxBytes,
  adminResourceImageUploadDtoSchema,
  adminSaveResourceDocumentRequestSchema,
} from "@workspace/contracts/admin"
import type {
  ResourceAssetUseCase,
  ResourceDocumentUseCase,
} from "@workspace/core/resource-library"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import {
  invalidAdminRequestError,
  notFoundAdminError,
  payloadTooLargeAdminError,
  preconditionRequiredAdminError,
  resourceAssetStoreUnavailableAdminError,
} from "@/errors/admin-errors"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonRequestBody,
  jsonResponse,
  markdownResponse,
  multipartRequestBody,
} from "@/http/openapi"
import { parseIntegerEtag, toIntegerEtag } from "@/http/integer-etag"
import type { ResourceAssetStore } from "@/resource-assets/resource-asset-store"
import {
  createResourceImageObjectKey,
  detectResourceImageMimeType,
} from "@/resource-assets/resource-image-file"
import { adminSessionRouteOptions } from "@/routes/admin-route-options"
import { throwResourceLibraryRejection } from "@/routes/resource-library-errors"

const resourceDocumentParamsSchema = z.object({
  documentId: z.string().trim().min(1),
})
const ifMatchHeadersSchema = z.object({
  "if-match": z.string().optional(),
})
const resourceImageUploadBodySchema = z.object({
  altText: adminResourceImageAltTextSchema,
  file: z.unknown().openapi({ format: "binary", type: "string" }),
})

export type ResourceDocumentsRouteDependencies = {
  readonly assetEventLogger?: {
    readonly error: (
      event: Readonly<Record<string, unknown>>,
      message: string
    ) => void
  }
  readonly assetService: ResourceAssetUseCase
  readonly assetStore?: ResourceAssetStore
  readonly documentService: ResourceDocumentUseCase
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createResourceDocumentsRoutes(
  dependencies: ResourceDocumentsRouteDependencies
) {
  return [
    createGetResourceDocumentRoute(dependencies),
    createSaveResourceDocumentRoute(dependencies),
    createImportResourceDocumentRoute(dependencies),
    createExportResourceDocumentRoute(dependencies),
    createUploadResourceImageRoute(dependencies),
  ] as const
}

function createUploadResourceImageRoute({
  assetService,
  assetStore,
  assetEventLogger,
  documentService,
  now,
  sessionResolver,
}: ResourceDocumentsRouteDependencies) {
  const routeConfig = {
    method: "post",
    operationId: "uploadAdminResourceLibraryImage",
    path: "/resources/documents/{documentId}/images",
    request: {
      body: multipartRequestBody(resourceImageUploadBodySchema),
      params: resourceDocumentParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "업로드한 자료 이미지입니다.",
          adminResourceImageUploadDtoSchema
        )
      ),
      400: errorJsonResponse("지원하지 않는 이미지 파일입니다."),
      404: errorJsonResponse("자료실 문서를 찾을 수 없습니다."),
      413: errorJsonResponse("이미지 파일 크기가 제한을 초과했습니다."),
      503: errorJsonResponse("자료 이미지 저장소를 사용할 수 없습니다."),
    },
    summary: "자료실 이미지 업로드",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    if (assetStore === undefined) {
      throw resourceAssetStoreUnavailableAdminError()
    }
    const documentId = context.req.valid("param").documentId
    const document = await documentService.getDocument({ documentId })
    if (document === null || document.status !== "active") {
      throw notFoundAdminError()
    }

    const { altText, file } = context.req.valid("form")
    if (!(file instanceof File)) throw invalidAdminRequestError()
    if (file.size > adminResourceImageMaxBytes) {
      throw payloadTooLargeAdminError()
    }
    const bytes = new Uint8Array(await file.arrayBuffer())
    const contentType = detectResourceImageMimeType(bytes)
    if (contentType === null) throw invalidAdminRequestError()

    const assetId = assetService.createAssetId()
    const objectKey = createResourceImageObjectKey({
      assetId,
      documentId,
      mimeType: contentType,
    })
    let url: string
    try {
      ;({ url } = await assetStore.putObject({
        body: bytes,
        contentType,
        objectKey,
      }))
    } catch {
      throw resourceAssetStoreUnavailableAdminError()
    }

    let registration: Awaited<ReturnType<ResourceAssetUseCase["registerImage"]>>
    try {
      registration = await assetService.registerImage({
        assetId,
        byteSize: bytes.byteLength,
        contentType,
        createdAt: now(),
        documentId,
        objectKey,
      })
    } catch (error) {
      await deleteUploadedObject(assetStore, objectKey, assetEventLogger)
      throw error
    }
    if (registration.kind === "not-found") {
      await deleteUploadedObject(assetStore, objectKey, assetEventLogger)
      throw notFoundAdminError()
    }

    return context.json(
      { altText, byteSize: bytes.byteLength, contentType, id: assetId, url },
      200
    )
  }
  return defineAdminRoute({ ...routeConfig, handler })
}

async function deleteUploadedObject(
  assetStore: ResourceAssetStore,
  objectKey: string,
  logger: ResourceDocumentsRouteDependencies["assetEventLogger"]
): Promise<void> {
  try {
    await assetStore.deleteObjects([objectKey])
  } catch (error) {
    logger?.error(
      { error, objectKey },
      "admin.resource-library.asset-rollback.failed"
    )
  }
}

function createGetResourceDocumentRoute({
  documentService,
  sessionResolver,
}: ResourceDocumentsRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminResourceLibraryDocument",
    path: "/resources/documents/{documentId}",
    request: { params: resourceDocumentParamsSchema },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "자료실 Markdown 문서입니다.",
          adminResourceDocumentDtoSchema
        )
      ),
      404: errorJsonResponse("자료실 문서를 찾을 수 없습니다."),
    },
    summary: "자료실 Markdown 문서 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const document = await documentService.getDocument(
      context.req.valid("param")
    )
    if (document === null) throw notFoundAdminError()
    return context.json(document, 200, {
      ETag: toIntegerEtag(document.version),
    })
  }
  return defineAdminRoute({ ...routeConfig, handler })
}

function createSaveResourceDocumentRoute({
  documentService,
  now,
  sessionResolver,
}: ResourceDocumentsRouteDependencies) {
  const routeConfig = {
    method: "put",
    operationId: "saveAdminResourceLibraryDocument",
    path: "/resources/documents/{documentId}",
    request: {
      body: jsonRequestBody(adminSaveResourceDocumentRequestSchema),
      headers: ifMatchHeadersSchema,
      params: resourceDocumentParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "저장한 자료실 문서입니다.",
          adminResourceDocumentDtoSchema
        )
      ),
      400: errorJsonResponse("유효하지 않은 자료실 문서입니다."),
      404: errorJsonResponse("자료실 문서를 찾을 수 없습니다."),
      409: errorJsonResponse("자료실 이름 충돌이 발생했습니다."),
      412: jsonResponse(
        "다른 탭이나 기기에서 먼저 저장한 최신 문서입니다.",
        adminResourceDocumentDtoSchema
      ),
      428: errorJsonResponse("If-Match 문서 버전이 필요합니다."),
    },
    summary: "자료실 제목과 Markdown 조건부 저장",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const ifMatch = context.req.valid("header")["if-match"]
    if (ifMatch === undefined) throw preconditionRequiredAdminError()
    const expectedVersion = parseIntegerEtag(ifMatch)
    if (expectedVersion === null) throw invalidAdminRequestError()

    const result = await documentService.saveDocument({
      ...context.req.valid("json"),
      actorId: context.get("activeAdminSession").admin.id,
      documentId: context.req.valid("param").documentId,
      expectedVersion,
      now: now(),
    })
    if (result.kind === "conflict") {
      return context.json(result.document, 412, {
        ETag: toIntegerEtag(result.document.version),
      })
    }
    if (result.kind !== "ok") throwResourceLibraryRejection(result)
    return context.json(result.document, 200, {
      ETag: toIntegerEtag(result.document.version),
    })
  }
  return defineAdminRoute({ ...routeConfig, handler })
}

function createImportResourceDocumentRoute({
  documentService,
  now,
  sessionResolver,
}: ResourceDocumentsRouteDependencies) {
  const routeConfig = {
    method: "post",
    operationId: "importAdminResourceLibraryDocument",
    path: "/resources/documents/import",
    request: {
      body: jsonRequestBody(adminImportResourceDocumentRequestSchema),
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "가져온 자료실 Markdown 문서입니다.",
          adminImportResourceDocumentResultDtoSchema
        )
      ),
      400: errorJsonResponse("유효하지 않은 Markdown 문서입니다."),
      404: errorJsonResponse("대상 폴더를 찾을 수 없습니다."),
      409: errorJsonResponse("자료실 이름 충돌이 발생했습니다."),
      422: errorJsonResponse("자료실 항목 한도를 초과했습니다."),
    },
    summary: "자료실 Markdown 단일 파일 가져오기",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const result = await documentService.importDocument({
      ...context.req.valid("json"),
      actorId: context.get("activeAdminSession").admin.id,
      now: now(),
    })
    if (result.kind !== "ok") throwResourceLibraryRejection(result)
    return context.json(result.value, 200)
  }
  return defineAdminRoute({ ...routeConfig, handler })
}

function createExportResourceDocumentRoute({
  documentService,
  sessionResolver,
}: ResourceDocumentsRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "exportAdminResourceLibraryDocument",
    path: "/resources/documents/{documentId}/export",
    request: { params: resourceDocumentParamsSchema },
    responses: {
      ...adminAuthenticatedResponses(
        markdownResponse("내보낸 자료실 Markdown 문서입니다.")
      ),
      404: errorJsonResponse("자료실 문서를 찾을 수 없습니다."),
    },
    summary: "자료실 Markdown 문서 내보내기",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const result = await documentService.exportDocument(
      context.req.valid("param")
    )
    if (result.kind === "not-found") throw notFoundAdminError()
    return context.body(result.value.markdown, 200, {
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(result.value.fileName)}`,
      "Content-Type": "text/markdown; charset=UTF-8",
    })
  }
  return defineAdminRoute({ ...routeConfig, handler })
}
