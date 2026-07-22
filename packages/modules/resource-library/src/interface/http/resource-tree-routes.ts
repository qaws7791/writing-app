import type { AnyRouteConfig } from "@workspace/http-platform/core"
import { jsonResponse } from "@workspace/http-platform/openapi"
import { z } from "@workspace/http-platform/zod"
import {
  adminCreateResourceNodeRequestSchema,
  adminMoveResourceNodeRequestSchema,
  adminRenameResourceFolderRequestSchema,
  adminResourceNodeMutationDtoSchema,
  adminResourceRestoreResultDtoSchema,
  adminResourceTrashResultDtoSchema,
  adminResourceTreeDtoSchema,
} from "@workspace/contracts/resource-library/admin-resource-tree"
import {
  adminResourceFolderIdSchema,
  adminResourceIdSchema,
  adminResourceTreeScopeSchema,
} from "@workspace/contracts/resource-library/shared"

import type { ResourceAdminSessionPort } from "#resource-library/application/ports/resource-library-ports"
import type { ResourceTreeApplication } from "#resource-library/application/resource-tree-application"
import { resourceLibrarySessionRouteOptions } from "#resource-library/interface/http/resource-library-http-auth"
import { mapResourceLibraryError } from "#resource-library/interface/http/resource-library-http-errors"
import { toResourceTreeNodeDto } from "#resource-library/interface/http/resource-library-http-mapper"
import {
  defineResourceLibraryRoute,
  resourceLibraryAuthenticatedResponses,
  resourceLibraryErrorJsonResponse,
  type ResourceLibraryRouteHandler,
} from "#resource-library/interface/http/resource-library-http-support"

const resourceTreeQuerySchema = z.object({
  scope: adminResourceTreeScopeSchema.optional().default("active"),
})
const resourceNodeParamsSchema = z.object({ nodeId: adminResourceIdSchema })
const resourceFolderParamsSchema = z.object({
  folderId: adminResourceFolderIdSchema,
})

export type ResourceTreeRouteDependencies = Readonly<{
  application: ResourceTreeApplication
  sessionPort: ResourceAdminSessionPort
}>

export function createResourceTreeRoutes(
  dependencies: ResourceTreeRouteDependencies
) {
  return Object.freeze([
    createGetResourceTreeRoute(dependencies),
    createResourceFolderRoute(dependencies),
    createResourceDocumentRoute(dependencies),
    createRenameResourceFolderRoute(dependencies),
    createMoveResourceNodeRoute(dependencies),
    createTrashResourceNodeRoute(dependencies),
    createRestoreResourceNodeRoute(dependencies),
    createDeleteResourceNodeRoute(dependencies),
  ])
}

function createGetResourceTreeRoute({
  application,
  sessionPort,
}: ResourceTreeRouteDependencies) {
  const routeConfig = {
    method: "get",
    operationId: "getAdminResourceTree",
    path: "/resources/tree",
    request: { query: resourceTreeQuerySchema },
    responses: resourceLibraryAuthenticatedResponses(
      jsonResponse("자료실 전체 트리입니다.", adminResourceTreeDtoSchema)
    ),
    summary: "자료실 전체 트리 조회",
    ...resourceLibrarySessionRouteOptions(sessionPort),
  } satisfies AnyRouteConfig

  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const entries = await application.readTree(context.req.valid("query").scope)
    return context.json(
      adminResourceTreeDtoSchema.parse({
        nodes: entries.map(({ hasChildren, node }) =>
          toResourceTreeNodeDto(node, hasChildren)
        ),
      }),
      200
    )
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function createResourceFolderRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  const routeConfig = mutationRouteConfig({
    bodySchema: adminCreateResourceNodeRequestSchema,
    operationId: "createAdminResourceFolder",
    path: "/resources/folders",
    responseDescription: "생성된 자료실 항목입니다.",
    responseSchema: adminResourceNodeMutationDtoSchema,
    sessionPort: dependencies.sessionPort,
    summary: "자료실 폴더 생성",
  })
  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const result = await dependencies.application.createFolder({
      actor: context.var.resourceActor,
      parentId: context.req.valid("json").parentId,
    })
    if (result.kind !== "ok") throw mapResourceLibraryError(result)
    return context.json(
      adminResourceNodeMutationDtoSchema.parse({
        node: toResourceTreeNodeDto(result.value.node, false),
      }),
      200
    )
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function createResourceDocumentRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  const routeConfig = mutationRouteConfig({
    bodySchema: adminCreateResourceNodeRequestSchema,
    operationId: "createAdminResourceDocumentNode",
    path: "/resources/documents",
    responseDescription: "생성된 자료실 항목입니다.",
    responseSchema: adminResourceNodeMutationDtoSchema,
    sessionPort: dependencies.sessionPort,
    summary: "자료실 문서 생성",
  })
  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const result = await dependencies.application.createDocument({
      actor: context.var.resourceActor,
      parentId: context.req.valid("json").parentId,
    })
    if (result.kind !== "ok") throw mapResourceLibraryError(result)
    return context.json(
      adminResourceNodeMutationDtoSchema.parse({
        node: toResourceTreeNodeDto(result.value.node, false),
      }),
      200
    )
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function createRenameResourceFolderRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  const routeConfig = {
    ...mutationRouteConfig({
      bodySchema: adminRenameResourceFolderRequestSchema,
      operationId: "renameAdminResourceFolder",
      path: "/resources/folders/{folderId}/name",
      responseDescription: "이름이 변경된 자료실 폴더입니다.",
      responseSchema: adminResourceNodeMutationDtoSchema,
      sessionPort: dependencies.sessionPort,
      summary: "자료실 폴더 이름 변경",
    }),
    method: "patch",
    request: {
      body: {
        content: {
          "application/json": {
            schema: adminRenameResourceFolderRequestSchema,
          },
        },
      },
      params: resourceFolderParamsSchema,
    },
  } satisfies AnyRouteConfig
  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const result = await dependencies.application.renameFolder({
      actor: context.var.resourceActor,
      folderId: context.req.valid("param").folderId,
      name: context.req.valid("json").name,
    })
    if (result.kind !== "ok") throw mapResourceLibraryError(result)
    return context.json(
      adminResourceNodeMutationDtoSchema.parse({
        node: toResourceTreeNodeDto(result.value.node, false),
      }),
      200
    )
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function createMoveResourceNodeRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  const routeConfig = {
    ...mutationRouteConfig({
      bodySchema: adminMoveResourceNodeRequestSchema,
      operationId: "moveAdminResourceNode",
      path: "/resources/nodes/{nodeId}/move",
      responseDescription: "이동한 자료실 항목입니다.",
      responseSchema: adminResourceNodeMutationDtoSchema,
      sessionPort: dependencies.sessionPort,
      summary: "자료실 항목 폴더 이동",
    }),
    method: "patch",
    request: {
      body: {
        content: {
          "application/json": { schema: adminMoveResourceNodeRequestSchema },
        },
      },
      params: resourceNodeParamsSchema,
    },
  } satisfies AnyRouteConfig
  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const result = await dependencies.application.moveNode({
      actor: context.var.resourceActor,
      destinationParentId: context.req.valid("json").destinationParentId,
      nodeId: context.req.valid("param").nodeId,
    })
    if (result.kind !== "ok") throw mapResourceLibraryError(result)
    return context.json(
      adminResourceNodeMutationDtoSchema.parse({
        node: toResourceTreeNodeDto(result.value.node, false),
      }),
      200
    )
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function createTrashResourceNodeRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  return createNodeActionRoute({
    action: (actor, nodeId) =>
      dependencies.application.trashNode({ actor, nodeId }),
    operationId: "trashAdminResourceNode",
    path: "/resources/nodes/{nodeId}/trash",
    responseDescription: "휴지통으로 이동한 하위 트리입니다.",
    responseSchema: adminResourceTrashResultDtoSchema,
    sessionPort: dependencies.sessionPort,
    summary: "자료실 하위 트리 휴지통 이동",
  })
}

function createRestoreResourceNodeRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  const routeConfig = nodeActionRouteConfig({
    method: "post",
    operationId: "restoreAdminResourceNode",
    path: "/resources/nodes/{nodeId}/restore",
    responseDescription: "복원한 하위 트리입니다.",
    responseSchema: adminResourceRestoreResultDtoSchema,
    sessionPort: dependencies.sessionPort,
    summary: "자료실 하위 트리 복원",
  })
  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const result = await dependencies.application.restoreNode({
      actor: context.var.resourceActor,
      nodeId: context.req.valid("param").nodeId,
    })
    if (result.kind !== "ok") throw mapResourceLibraryError(result)
    return context.json(
      adminResourceRestoreResultDtoSchema.parse({
        ...result.value,
        node: toResourceTreeNodeDto(result.value.node, true),
      }),
      200
    )
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function createDeleteResourceNodeRoute(
  dependencies: ResourceTreeRouteDependencies
) {
  return createNodeActionRoute({
    action: (actor, nodeId) =>
      dependencies.application.deleteNodePermanently({ actor, nodeId }),
    method: "delete",
    operationId: "deleteAdminResourceNodePermanently",
    path: "/resources/nodes/{nodeId}",
    responseDescription: "영구 삭제한 하위 트리입니다.",
    responseSchema: adminResourceTrashResultDtoSchema,
    sessionPort: dependencies.sessionPort,
    summary: "자료실 하위 트리 영구 삭제",
  })
}

function createNodeActionRoute(input: {
  readonly action: (
    actor: Parameters<ResourceTreeApplication["trashNode"]>[0]["actor"],
    nodeId: Parameters<ResourceTreeApplication["trashNode"]>[0]["nodeId"]
  ) => Promise<
    | Awaited<ReturnType<ResourceTreeApplication["trashNode"]>>
    | Awaited<ReturnType<ResourceTreeApplication["deleteNodePermanently"]>>
  >
  readonly method?: "delete" | "post"
  readonly operationId: string
  readonly path: string
  readonly responseDescription: string
  readonly responseSchema: typeof adminResourceTrashResultDtoSchema
  readonly sessionPort: ResourceAdminSessionPort
  readonly summary: string
}) {
  const routeConfig = nodeActionRouteConfig({
    ...input,
    method: input.method ?? "post",
  })
  const handler: ResourceLibraryRouteHandler<typeof routeConfig> = async (
    context
  ) => {
    const result = await input.action(
      context.var.resourceActor,
      context.req.valid("param").nodeId
    )
    if (result.kind !== "ok") throw mapResourceLibraryError(result)
    return context.json(input.responseSchema.parse(result.value), 200)
  }
  return defineResourceLibraryRoute({ ...routeConfig, handler })
}

function mutationRouteConfig<const TSchema extends z.ZodType>(input: {
  readonly bodySchema: TSchema
  readonly operationId: string
  readonly path: string
  readonly responseDescription: string
  readonly responseSchema: z.ZodType
  readonly sessionPort: ResourceAdminSessionPort
  readonly summary: string
}) {
  return {
    method: "post",
    operationId: input.operationId,
    path: input.path,
    request: {
      body: {
        content: { "application/json": { schema: input.bodySchema } },
      },
    },
    responses: mutationResponses(
      input.responseDescription,
      input.responseSchema
    ),
    summary: input.summary,
    ...resourceLibrarySessionRouteOptions(input.sessionPort),
  } satisfies AnyRouteConfig
}

function nodeActionRouteConfig(input: {
  readonly method: "delete" | "post"
  readonly operationId: string
  readonly path: string
  readonly responseDescription: string
  readonly responseSchema: z.ZodType
  readonly sessionPort: ResourceAdminSessionPort
  readonly summary: string
}) {
  return {
    method: input.method,
    operationId: input.operationId,
    path: input.path,
    request: { params: resourceNodeParamsSchema },
    responses: mutationResponses(
      input.responseDescription,
      input.responseSchema
    ),
    summary: input.summary,
    ...resourceLibrarySessionRouteOptions(input.sessionPort),
  } satisfies AnyRouteConfig
}

function mutationResponses(description: string, schema: z.ZodType) {
  return {
    ...resourceLibraryAuthenticatedResponses(jsonResponse(description, schema)),
    400: resourceLibraryErrorJsonResponse("잘못된 자료실 명령입니다."),
    404: resourceLibraryErrorJsonResponse("자료실 항목을 찾을 수 없습니다."),
    409: resourceLibraryErrorJsonResponse("자료실 변경 충돌이 발생했습니다."),
    422: resourceLibraryErrorJsonResponse("자료실 제한을 초과했습니다."),
    503: resourceLibraryErrorJsonResponse(
      "자료실 외부 저장소를 사용할 수 없습니다."
    ),
  }
}
