import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminArchiveResourceDocumentResultSchema,
  adminDeleteResourceDocumentResultSchema,
  adminResourceDocumentDetailDtoSchema,
  adminResourceDocumentListDtoSchema,
  adminResourceDocumentRequestSchema,
  adminResourceDocumentStatusFilterSchema,
} from "@workspace/contracts/admin"
import type { AdminResourceUseCase } from "@workspace/core/admin"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import { forbiddenAdminError, notFoundAdminError } from "@/errors/admin-errors"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonRequestBody,
  jsonResponse,
} from "@/http/openapi"
import { adminSessionRouteOptions } from "@/routes/admin-route-options"
import { positiveIntegerQuery } from "@/routes/query-schemas"

const defaultPage = 1
const defaultPageSize = 20
const maxPageSize = 100

const resourcesQuerySchema = z.object({
  page: positiveIntegerQuery({
    fallback: defaultPage,
  }),
  pageSize: positiveIntegerQuery({
    fallback: defaultPageSize,
    max: maxPageSize,
  }),
  query: z.string().optional().default(""),
  status: adminResourceDocumentStatusFilterSchema.optional().default("all"),
})

const resourceParamsSchema = z.object({
  documentId: z.string(),
})

export type ResourcesRouteDependencies = {
  readonly now: () => Date
  readonly resourceService: AdminResourceUseCase
  readonly sessionResolver: AdminSessionResolver
}

export function createResourcesRoutes(
  dependencies: ResourcesRouteDependencies
) {
  return [
    createListResourcesRoute(dependencies),
    createCreateResourceRoute(dependencies),
    createGetResourceRoute(dependencies),
    createUpdateResourceRoute(dependencies),
    createArchiveResourceRoute(dependencies),
    createDeleteResourceRoute(dependencies),
  ] as const
}

function createListResourcesRoute({
  resourceService,
  sessionResolver,
}: ResourcesRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminResources",
    path: "/resources",
    request: {
      query: resourcesQuerySchema,
    },
    responses: adminAuthenticatedResponses(
      jsonResponse(
        "어드민 자료 문서 목록입니다.",
        adminResourceDocumentListDtoSchema
      )
    ),
    summary: "어드민 자료 문서 목록 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) =>
    context.json(
      await resourceService.getResourceDocuments(context.req.valid("query")),
      200
    )

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createCreateResourceRoute({
  now,
  resourceService,
  sessionResolver,
}: ResourcesRouteDependencies) {
  const routeConfig = {
    method: "post",
    operationId: "createAdminResource",
    path: "/resources",
    request: {
      body: jsonRequestBody(adminResourceDocumentRequestSchema),
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "생성된 어드민 자료 문서입니다.",
          adminResourceDocumentDetailDtoSchema
        )
      ),
      400: errorJsonResponse("잘못된 요청입니다."),
    },
    summary: "어드민 자료 문서 생성",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const body = context.req.valid("json")
    const session = context.get("activeAdminSession")

    return context.json(
      await resourceService.createResourceDocument({
        ...body,
        adminId: session.admin.id,
        now: now(),
      }),
      200
    )
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createGetResourceRoute({
  resourceService,
  sessionResolver,
}: ResourcesRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminResource",
    path: "/resources/{documentId}",
    request: {
      params: resourceParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "어드민 자료 문서 상세입니다.",
          adminResourceDocumentDetailDtoSchema
        )
      ),
      404: errorJsonResponse("자료 문서를 찾을 수 없습니다."),
    },
    summary: "어드민 자료 문서 상세 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { documentId } = context.req.valid("param")
    const document = await resourceService.getResourceDocument({ documentId })

    if (document === null) {
      throw notFoundAdminError()
    }

    return context.json(document, 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createUpdateResourceRoute({
  now,
  resourceService,
  sessionResolver,
}: ResourcesRouteDependencies) {
  const routeConfig = {
    method: "put",
    operationId: "updateAdminResource",
    path: "/resources/{documentId}",
    request: {
      body: jsonRequestBody(adminResourceDocumentRequestSchema),
      params: resourceParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "수정된 어드민 자료 문서입니다.",
          adminResourceDocumentDetailDtoSchema
        )
      ),
      400: errorJsonResponse("잘못된 요청입니다."),
      404: errorJsonResponse("자료 문서를 찾을 수 없습니다."),
    },
    summary: "어드민 자료 문서 수정",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { documentId } = context.req.valid("param")
    const body = context.req.valid("json")
    const document = await resourceService.updateResourceDocument({
      ...body,
      documentId,
      now: now(),
    })

    if (document === null) {
      throw notFoundAdminError()
    }

    return context.json(document, 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createArchiveResourceRoute({
  now,
  resourceService,
  sessionResolver,
}: ResourcesRouteDependencies) {
  const routeConfig = {
    method: "patch",
    operationId: "archiveAdminResource",
    path: "/resources/{documentId}/archive",
    request: {
      params: resourceParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "보관된 어드민 자료 문서 결과입니다.",
          adminArchiveResourceDocumentResultSchema
        )
      ),
      403: errorJsonResponse("자료 문서 작성자만 보관할 수 있습니다."),
      404: errorJsonResponse("자료 문서를 찾을 수 없습니다."),
    },
    summary: "어드민 자료 문서 보관",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { documentId } = context.req.valid("param")
    const session = context.get("activeAdminSession")
    const result = await resourceService.archiveResourceDocument({
      adminId: session.admin.id,
      documentId,
      now: now(),
    })

    if (result.kind === "not-found") {
      throw notFoundAdminError()
    }

    if (result.kind === "forbidden") {
      throw forbiddenAdminError()
    }

    return context.json(result.value, 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}

function createDeleteResourceRoute({
  resourceService,
  sessionResolver,
}: ResourcesRouteDependencies) {
  const routeConfig = {
    method: "delete",
    operationId: "deleteAdminResource",
    path: "/resources/{documentId}",
    request: {
      params: resourceParamsSchema,
    },
    responses: {
      ...adminAuthenticatedResponses(
        jsonResponse(
          "삭제된 어드민 자료 문서 결과입니다.",
          adminDeleteResourceDocumentResultSchema
        )
      ),
      403: errorJsonResponse("자료 문서 작성자만 삭제할 수 있습니다."),
      404: errorJsonResponse("자료 문서를 찾을 수 없습니다."),
    },
    summary: "어드민 자료 문서 삭제",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const { documentId } = context.req.valid("param")
    const session = context.get("activeAdminSession")
    const result = await resourceService.deleteResourceDocument({
      adminId: session.admin.id,
      documentId,
    })

    if (result.kind === "not-found") {
      throw notFoundAdminError()
    }

    if (result.kind === "forbidden") {
      throw forbiddenAdminError()
    }

    return context.json(result.value, 200)
  }

  return defineAdminRoute({
    ...routeConfig,
    handler,
  })
}
