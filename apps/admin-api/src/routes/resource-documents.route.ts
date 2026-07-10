import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminImportResourceDocumentRequestSchema,
  adminImportResourceDocumentResultDtoSchema,
  adminResourceDocumentDtoSchema,
} from "@workspace/contracts/admin"
import type { ResourceDocumentUseCase } from "@workspace/core/modules/resource-library/api"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import { notFoundAdminError } from "@/errors/admin-errors"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonRequestBody,
  jsonResponse,
  markdownResponse,
} from "@/http/openapi"
import { adminSessionRouteOptions } from "@/routes/admin-route-options"
import { throwResourceLibraryRejection } from "@/routes/resource-library-errors"

const resourceDocumentParamsSchema = z.object({
  documentId: z.string().trim().min(1),
})

export type ResourceDocumentsRouteDependencies = {
  readonly documentService: ResourceDocumentUseCase
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
}

export function createResourceDocumentsRoutes(
  dependencies: ResourceDocumentsRouteDependencies
) {
  return [
    createGetResourceDocumentRoute(dependencies),
    createImportResourceDocumentRoute(dependencies),
    createExportResourceDocumentRoute(dependencies),
  ] as const
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

    if (document === null) {
      throw notFoundAdminError()
    }

    return context.json(document, 200)
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
      409: errorJsonResponse("자료실 변경 충돌이 발생했습니다."),
    },
    summary: "자료실 Markdown 단일 파일 가져오기",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const session = context.get("activeAdminSession")
    const result = await documentService.importDocument({
      ...context.req.valid("json"),
      actorId: session.admin.id,
      now: now(),
    })

    if (result.kind !== "ok") {
      throwResourceLibraryRejection(result)
    }

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

    if (result.kind === "not-found") {
      throw notFoundAdminError()
    }

    return context.body(result.value.markdown, 200, {
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeFileName(result.value.fileName)}`,
      "Content-Type": "text/markdown; charset=UTF-8",
    })
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function encodeFileName(fileName: string): string {
  return encodeURIComponent(fileName).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  )
}
