import type { AnyRouteConfig } from "@workspace/hono/core"
import {
  adminCreateResourceNodeRequestSchema,
  adminMoveResourceNodeRequestSchema,
  adminRenameResourceFolderRequestSchema,
  adminResourceNodeMutationDtoSchema,
  adminResourceRestoreResultDtoSchema,
  adminResourceTrashResultDtoSchema,
  adminResourceTreeDtoSchema,
  adminResourceTreeScopeSchema,
} from "@workspace/contracts/admin"
import type { ResourceTreeUseCase } from "@workspace/core/resource-library"
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
  scope: adminResourceTreeScopeSchema.optional().default("active"),
})
const resourceNodeParamsSchema = z.object({
  nodeId: z.string().trim().min(1),
})
const resourceFolderParamsSchema = z.object({
  folderId: z.string().trim().min(1),
})

export type ResourceTreeRouteDependencies = {
  readonly now: () => Date
  readonly onObjectsDeleted?: (objectKeys: readonly string[]) => Promise<void>
  readonly sessionResolver: AdminSessionResolver
  readonly treeService: ResourceTreeUseCase
}

export function createResourceTreeRoutes(
  dependencies: ResourceTreeRouteDependencies
) {
  return [
    createGetResourceTreeRoute(dependencies),
    createResourceFolderRoute(dependencies),
    createResourceDocumentRoute(dependencies),
    createRenameResourceFolderRoute(dependencies),
    createMoveResourceNodeRoute(dependencies),
    createTrashResourceNodeRoute(dependencies),
    createRestoreResourceNodeRoute(dependencies),
    createDeleteResourceNodeRoute(dependencies),
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
      jsonResponse("자료실 전체 트리입니다.", adminResourceTreeDtoSchema)
    ),
    summary: "자료실 전체 트리 조회",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) =>
    context.json(await treeService.getTree(context.req.valid("query")), 200)

  return defineAdminRoute({ ...routeConfig, handler })
}

function createResourceFolderRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  const routeConfig = {
    method: "post",
    operationId: "createAdminResourceFolder",
    path: "/resources/folders",
    request: { body: jsonRequestBody(adminCreateResourceNodeRequestSchema) },
    responses: mutationResponses(
      "생성된 자료실 항목입니다.",
      adminResourceNodeMutationDtoSchema
    ),
    summary: "자료실 폴더 생성",
    ...adminSessionRouteOptions(dependencies.sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const command = {
      ...context.req.valid("json"),
      actorId: context.get("activeAdminSession").admin.id,
      now: dependencies.now(),
    }
    const result = await dependencies.treeService.createFolder(command)
    if (result.kind !== "ok") throwResourceLibraryRejection(result)
    return context.json(result.value, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function createResourceDocumentRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  const routeConfig = {
    method: "post",
    operationId: "createAdminResourceDocumentNode",
    path: "/resources/documents",
    request: { body: jsonRequestBody(adminCreateResourceNodeRequestSchema) },
    responses: mutationResponses(
      "생성된 자료실 항목입니다.",
      adminResourceNodeMutationDtoSchema
    ),
    summary: "자료실 문서 생성",
    ...adminSessionRouteOptions(dependencies.sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const result = await dependencies.treeService.createDocument({
      ...context.req.valid("json"),
      actorId: context.get("activeAdminSession").admin.id,
      now: dependencies.now(),
    })
    if (result.kind !== "ok") throwResourceLibraryRejection(result)
    return context.json(result.value, 200)
  }

  return defineAdminRoute({ ...routeConfig, handler })
}

function createRenameResourceFolderRoute({
  now,
  sessionResolver,
  treeService,
}: ResourceTreeRouteDependencies) {
  const routeConfig = {
    method: "patch",
    operationId: "renameAdminResourceFolder",
    path: "/resources/folders/{folderId}/name",
    request: {
      body: jsonRequestBody(adminRenameResourceFolderRequestSchema),
      params: resourceFolderParamsSchema,
    },
    responses: mutationResponses(
      "이름이 변경된 자료실 폴더입니다.",
      adminResourceNodeMutationDtoSchema
    ),
    summary: "자료실 폴더 이름 변경",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const result = await treeService.renameFolder({
      ...context.req.valid("json"),
      actorId: context.get("activeAdminSession").admin.id,
      folderId: context.req.valid("param").folderId,
      now: now(),
    })
    if (result.kind !== "ok") throwResourceLibraryRejection(result)
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
    responses: mutationResponses(
      "이동한 자료실 항목입니다.",
      adminResourceNodeMutationDtoSchema
    ),
    summary: "자료실 항목 폴더 이동",
    ...adminSessionRouteOptions(sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const result = await treeService.moveNode({
      ...context.req.valid("json"),
      actorId: context.get("activeAdminSession").admin.id,
      nodeId: context.req.valid("param").nodeId,
      now: now(),
    })
    if (result.kind !== "ok") throwResourceLibraryRejection(result)
    return context.json(result.value, 200)
  }
  return defineAdminRoute({ ...routeConfig, handler })
}

function createTrashResourceNodeRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  const routeConfig = {
    method: "post",
    operationId: "trashAdminResourceNode",
    path: "/resources/nodes/{nodeId}/trash",
    request: { params: resourceNodeParamsSchema },
    responses: mutationResponses(
      "휴지통으로 이동한 하위 트리입니다.",
      adminResourceTrashResultDtoSchema
    ),
    summary: "자료실 하위 트리 휴지통 이동",
    ...adminSessionRouteOptions(dependencies.sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const result = await dependencies.treeService.trashNode({
      actorId: context.get("activeAdminSession").admin.id,
      nodeId: context.req.valid("param").nodeId,
      now: dependencies.now(),
    })
    if (result.kind !== "ok") throwResourceLibraryRejection(result)
    return context.json(result.value, 200)
  }
  return defineAdminRoute({ ...routeConfig, handler })
}

function createRestoreResourceNodeRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  const routeConfig = {
    method: "post",
    operationId: "restoreAdminResourceNode",
    path: "/resources/nodes/{nodeId}/restore",
    request: { params: resourceNodeParamsSchema },
    responses: mutationResponses(
      "복원한 하위 트리입니다.",
      adminResourceRestoreResultDtoSchema
    ),
    summary: "자료실 하위 트리 복원",
    ...adminSessionRouteOptions(dependencies.sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const result = await dependencies.treeService.restoreNode({
      actorId: context.get("activeAdminSession").admin.id,
      nodeId: context.req.valid("param").nodeId,
      now: dependencies.now(),
    })
    if (result.kind !== "ok") throwResourceLibraryRejection(result)
    return context.json(result.value, 200)
  }
  return defineAdminRoute({ ...routeConfig, handler })
}

function createDeleteResourceNodeRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  const routeConfig = {
    method: "delete",
    operationId: "deleteAdminResourceNodePermanently",
    path: "/resources/nodes/{nodeId}",
    request: { params: resourceNodeParamsSchema },
    responses: mutationResponses(
      "영구 삭제한 하위 트리입니다.",
      adminResourceTrashResultDtoSchema
    ),
    summary: "자료실 하위 트리 영구 삭제",
    ...adminSessionRouteOptions(dependencies.sessionResolver),
  } satisfies AnyRouteConfig

  const handler: AdminRouteHandler<typeof routeConfig> = async (context) => {
    const result = await dependencies.treeService.deleteNodePermanently({
      actorId: context.get("activeAdminSession").admin.id,
      nodeId: context.req.valid("param").nodeId,
      now: dependencies.now(),
    })
    if (result.kind !== "ok") throwResourceLibraryRejection(result)
    await dependencies.onObjectsDeleted?.(result.value.r2ObjectKeys)
    return context.json(
      {
        documentCount: result.value.documentCount,
        folderCount: result.value.folderCount,
      },
      200
    )
  }
  return defineAdminRoute({ ...routeConfig, handler })
}

function mutationResponses(description: string, schema: z.ZodType) {
  return {
    ...adminAuthenticatedResponses(jsonResponse(description, schema)),
    400: errorJsonResponse("잘못된 자료실 명령입니다."),
    404: errorJsonResponse("자료실 항목을 찾을 수 없습니다."),
    409: errorJsonResponse("자료실 변경 충돌이 발생했습니다."),
    422: errorJsonResponse("자료실 제한을 초과했습니다."),
  }
}
