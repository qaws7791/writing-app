import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminCreateResourceNodeRequestSchema,
  adminMoveResourceNodeRequestSchema,
  adminRenameResourceNodeRequestSchema,
  adminResourceNodeMutationDtoSchema,
  adminResourceRestoreResultDtoSchema,
  adminResourceRevisionRequestSchema,
  adminResourceTrashResultDtoSchema,
  adminResourceTreeDtoSchema,
  adminResourceTreeScopeSchema,
} from "@workspace/contracts/admin"
import type { ResourceTreeUseCase } from "@workspace/core/modules/resource-library/api"
import { z } from "@workspace/hono/zod"

import type { AdminSessionResolver } from "@/auth/admin-session"
import { defineAdminRoute, type AdminRouteHandler } from "@/context/hono-env"
import {
  adminAuthenticatedResponses,
  errorJsonResponse,
  jsonRequestBody,
  jsonResponse,
} from "@/http/openapi"
import { adminSessionRouteOptions } from "@/routes/admin-route-options"
import { throwResourceLibraryRejection } from "@/routes/resource-library-errors"

const resourceTreeQuerySchema = z.object({
  parentId: z
    .string()
    .trim()
    .min(1)
    .optional()
    .transform((parentId) => parentId ?? null),
  scope: adminResourceTreeScopeSchema.optional().default("active"),
})

const resourceNodeParamsSchema = z.object({
  nodeId: z.string().trim().min(1),
})

export type ResourceTreeRouteDependencies = {
  readonly now: () => Date
  readonly sessionResolver: AdminSessionResolver
  readonly treeService: ResourceTreeUseCase
}

export function createResourceTreeRoutes(
  dependencies: ResourceTreeRouteDependencies
) {
  return [
    createGetResourceTreeRoute(dependencies),
    createCreateResourceFolderRoute(dependencies),
    createCreateResourceDocumentRoute(dependencies),
    createRenameResourceNodeRoute(dependencies),
    createMoveResourceNodeRoute(dependencies),
    createTrashResourceNodeRoute(dependencies),
    createRestoreResourceNodeRoute(dependencies),
  ] as const
}

function createGetResourceTreeRoute({
  sessionResolver,
  treeService,
}: ResourceTreeRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminResourceTree",
    path: "/resources/tree",
    request: { query: resourceTreeQuerySchema },
    responses: adminAuthenticatedResponses(
      jsonResponse("자료실 트리의 자식 항목입니다.", adminResourceTreeDtoSchema)
    ),
    summary: "자료실 트리 지연 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) =>
    context.json(await treeService.getTree(context.req.valid("query")), 200)

  return defineAdminRoute({ ...routeConfig, handler })
}

function createCreateResourceFolderRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  return createResourceNodeRoute({
    ...dependencies,
    kind: "folder",
    operationId: "createAdminResourceFolder",
    path: "/resources/folders",
    summary: "자료실 폴더 생성",
  })
}

function createCreateResourceDocumentRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  return createResourceNodeRoute({
    ...dependencies,
    kind: "document",
    operationId: "createAdminResourceDocumentNode",
    path: "/resources/documents",
    summary: "자료실 문서 생성",
  })
}

function createResourceNodeRoute({
  kind,
  now,
  operationId,
  path,
  sessionResolver,
  summary,
  treeService,
}: ResourceTreeRouteDependencies & {
  readonly kind: "document" | "folder"
  readonly operationId: string
  readonly path: string
  readonly summary: string
}) {
  const routeConfig = {
    method: "post",
    operationId,
    path,
    request: { body: jsonRequestBody(adminCreateResourceNodeRequestSchema) },
    responses: resourceMutationResponses(
      "생성된 자료실 항목입니다.",
      adminResourceNodeMutationDtoSchema
    ),
    summary,
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const session = context.get("activeAdminSession")
    const command = {
      ...context.req.valid("json"),
      actorId: session.admin.id,
      now: now(),
    }
    const result =
      kind === "folder"
        ? await treeService.createFolder(command)
        : await treeService.createDocument(command)

    if (result.kind !== "ok") {
      throwResourceLibraryRejection(result)
    }

    return context.json(result.value, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function createRenameResourceNodeRoute({
  now,
  sessionResolver,
  treeService,
}: ResourceTreeRouteDependencies) {
  const routeConfig = {
    method: "patch",
    operationId: "renameAdminResourceNode",
    path: "/resources/nodes/{nodeId}/name",
    request: {
      body: jsonRequestBody(adminRenameResourceNodeRequestSchema),
      params: resourceNodeParamsSchema,
    },
    responses: resourceMutationResponses(
      "이름이 변경된 자료실 항목입니다.",
      adminResourceNodeMutationDtoSchema
    ),
    summary: "자료실 항목 이름 변경",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const session = context.get("activeAdminSession")
    const result = await treeService.renameNode({
      ...context.req.valid("json"),
      actorId: session.admin.id,
      nodeId: context.req.valid("param").nodeId,
      now: now(),
    })

    if (result.kind !== "ok") {
      throwResourceLibraryRejection(result)
    }

    return context.json(result.value, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function createMoveResourceNodeRoute({
  now,
  sessionResolver,
  treeService,
}: ResourceTreeRouteDependencies) {
  const routeConfig = {
    method: "patch",
    operationId: "moveAdminResourceNode",
    path: "/resources/nodes/{nodeId}/move",
    request: {
      body: jsonRequestBody(adminMoveResourceNodeRequestSchema),
      params: resourceNodeParamsSchema,
    },
    responses: resourceMutationResponses(
      "이동한 자료실 항목입니다.",
      adminResourceNodeMutationDtoSchema
    ),
    summary: "자료실 항목 이동",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const session = context.get("activeAdminSession")
    const result = await treeService.moveNode({
      ...context.req.valid("json"),
      actorId: session.admin.id,
      nodeId: context.req.valid("param").nodeId,
      now: now(),
    })

    if (result.kind !== "ok") {
      throwResourceLibraryRejection(result)
    }

    return context.json(result.value, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function createTrashResourceNodeRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  return createResourceRevisionRoute({
    ...dependencies,
    action: "trash",
    description: "휴지통으로 이동한 자료실 하위 트리의 결과입니다.",
    operationId: "trashAdminResourceNode",
    path: "/resources/nodes/{nodeId}/trash",
    responseSchema: adminResourceTrashResultDtoSchema,
    summary: "자료실 항목 하위 트리 휴지통 이동",
  })
}

function createRestoreResourceNodeRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  return createResourceRevisionRoute({
    ...dependencies,
    action: "restore",
    description: "복원한 자료실 하위 트리의 결과입니다.",
    operationId: "restoreAdminResourceNode",
    path: "/resources/nodes/{nodeId}/restore",
    responseSchema: adminResourceRestoreResultDtoSchema,
    summary: "자료실 항목 하위 트리 복원",
  })
}

function createResourceRevisionRoute({
  action,
  description,
  now,
  operationId,
  path,
  responseSchema,
  sessionResolver,
  summary,
  treeService,
}: ResourceTreeRouteDependencies & {
  readonly action: "restore" | "trash"
  readonly description: string
  readonly operationId: string
  readonly path: string
  readonly responseSchema: z.ZodType
  readonly summary: string
}) {
  const routeConfig = {
    method: "post",
    operationId,
    path,
    request: {
      body: jsonRequestBody(adminResourceRevisionRequestSchema),
      params: resourceNodeParamsSchema,
    },
    responses: resourceMutationResponses(description, responseSchema),
    summary,
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const session = context.get("activeAdminSession")
    const command = {
      ...context.req.valid("json"),
      actorId: session.admin.id,
      nodeId: context.req.valid("param").nodeId,
      now: now(),
    }
    const result =
      action === "trash"
        ? await treeService.trashNode(command)
        : await treeService.restoreNode(command)

    if (result.kind !== "ok") {
      throwResourceLibraryRejection(result)
    }

    return context.json(result.value, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function resourceMutationResponses(description: string, schema: z.ZodType) {
  return {
    ...adminAuthenticatedResponses(jsonResponse(description, schema)),
    400: errorJsonResponse("잘못된 자료실 명령입니다."),
    404: errorJsonResponse("자료실 항목을 찾을 수 없습니다."),
    409: errorJsonResponse("자료실 변경 충돌이 발생했습니다."),
  }
}
