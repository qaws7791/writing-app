import {
  adminResourceNodeMutationDtoSchema,
  adminResourceRestoreResultDtoSchema,
  adminResourceTrashMutationDtoSchema,
  adminResourceTreeDtoSchema,
  type AdminResourceNodeMutationDto,
  type AdminResourceRestoreResultDto,
  type AdminResourceTrashMutationDto,
  type AdminResourceTreeDto,
  type AdminResourceTreeNodeDto,
  type AdminResourceTreeScope,
} from "@workspace/contracts/admin"

import type {
  ResourceTreeCommandResult,
  ResourceTreeRepository,
} from "@workspace/core/modules/resource-library/application/ports/resource-tree.repository"
import {
  toResourceFolderId,
  toResourceNodeId,
  type ResourceAuditEventId,
  type ResourceDocumentId,
  type ResourceFolderId,
  type ResourceTreeNode,
} from "@workspace/core/modules/resource-library/domain/resource-tree-node"

type ResourceStructureCommandInput = {
  readonly actorId: string
  readonly expectedRevision: number
  readonly now: Date
}

type ResourceParentCommandInput = ResourceStructureCommandInput & {
  readonly parentId: string | null
}

export type ResourceTreeUseCase = {
  readonly createDocument: (
    input: ResourceParentCommandInput
  ) => Promise<ResourceTreeCommandResult<AdminResourceNodeMutationDto>>
  readonly createFolder: (
    input: ResourceParentCommandInput
  ) => Promise<ResourceTreeCommandResult<AdminResourceNodeMutationDto>>
  readonly getTree: (input: {
    readonly parentId: string | null
    readonly scope: AdminResourceTreeScope
  }) => Promise<AdminResourceTreeDto>
  readonly getSubtreeDocumentIds: (
    nodeId: string
  ) => Promise<readonly ResourceDocumentId[]>
  readonly moveNode: (
    input: ResourceStructureCommandInput & {
      readonly destinationIndex: number
      readonly destinationParentId: string | null
      readonly nodeId: string
    }
  ) => Promise<ResourceTreeCommandResult<AdminResourceNodeMutationDto>>
  readonly renameNode: (
    input: ResourceStructureCommandInput & {
      readonly name: string
      readonly nodeId: string
    }
  ) => Promise<ResourceTreeCommandResult<AdminResourceNodeMutationDto>>
  readonly restoreNode: (
    input: ResourceStructureCommandInput & { readonly nodeId: string }
  ) => Promise<ResourceTreeCommandResult<AdminResourceRestoreResultDto>>
  readonly trashNode: (
    input: ResourceStructureCommandInput & { readonly nodeId: string }
  ) => Promise<ResourceTreeCommandResult<AdminResourceTrashMutationDto>>
}

export type ResourceTreeUseCaseDependencies = {
  readonly createAuditEventId: () => ResourceAuditEventId
  readonly createDocumentId: () => ResourceDocumentId
  readonly createFolderId: () => ResourceFolderId
  readonly treeRepository: ResourceTreeRepository
}

export function createResourceTreeUseCase({
  createAuditEventId,
  createDocumentId,
  createFolderId,
  treeRepository,
}: ResourceTreeUseCaseDependencies): ResourceTreeUseCase {
  return {
    async createDocument(input) {
      const result = await treeRepository.createNode({
        ...toRepositoryCommand(input, createAuditEventId()),
        kind: "document",
        nodeId: createDocumentId(),
        parentId: toParentId(input.parentId),
        preferredName: "제목 없음",
      })

      return result.kind === "ok"
        ? {
            kind: "ok",
            value: adminResourceNodeMutationDtoSchema.parse({
              ...result.value,
              node: toTreeNodeDto(result.value.node, false),
            }),
          }
        : result
    },
    async createFolder(input) {
      const result = await treeRepository.createNode({
        ...toRepositoryCommand(input, createAuditEventId()),
        kind: "folder",
        nodeId: createFolderId(),
        parentId: toParentId(input.parentId),
        preferredName: "새 폴더",
      })

      return result.kind === "ok"
        ? {
            kind: "ok",
            value: adminResourceNodeMutationDtoSchema.parse({
              ...result.value,
              node: toTreeNodeDto(result.value.node, false),
            }),
          }
        : result
    },
    async getTree(input) {
      const [nodes, revision] = await Promise.all([
        treeRepository.readChildren({
          parentId: toParentId(input.parentId),
          scope: input.scope,
        }),
        treeRepository.readRevision(),
      ])

      return adminResourceTreeDtoSchema.parse({
        nodes: nodes.map(({ hasChildren, node }) =>
          toTreeNodeDto(node, hasChildren)
        ),
        revision,
      })
    },
    async getSubtreeDocumentIds(nodeId) {
      const subtree = await treeRepository.readSubtree(toResourceNodeId(nodeId))

      return subtree.flatMap((node) =>
        node.kind === "document" && node.status === "active" ? [node.id] : []
      )
    },
    async moveNode(input) {
      const result = await treeRepository.moveNode({
        ...toRepositoryCommand(input, createAuditEventId()),
        destinationIndex: input.destinationIndex,
        destinationParentId: toParentId(input.destinationParentId),
        nodeId: toResourceNodeId(input.nodeId),
      })

      return mapNodeMutation(treeRepository, result)
    },
    async renameNode(input) {
      const result = await treeRepository.renameNode({
        ...toRepositoryCommand(input, createAuditEventId()),
        name: input.name,
        nodeId: toResourceNodeId(input.nodeId),
      })

      return mapNodeMutation(treeRepository, result)
    },
    async restoreNode(input) {
      const result = await treeRepository.restoreNode({
        ...toRepositoryCommand(input, createAuditEventId()),
        nodeId: toResourceNodeId(input.nodeId),
      })

      return result.kind === "ok"
        ? {
            kind: "ok",
            value: adminResourceRestoreResultDtoSchema.parse({
              ...result.value,
              node: toTreeNodeDto(
                result.value.node,
                result.value.node.kind === "folder" &&
                  result.value.documentCount + result.value.folderCount > 1
              ),
            }),
          }
        : result
    },
    async trashNode(input) {
      const result = await treeRepository.trashNode({
        ...toRepositoryCommand(input, createAuditEventId()),
        nodeId: toResourceNodeId(input.nodeId),
      })

      return result.kind === "ok"
        ? {
            kind: "ok",
            value: adminResourceTrashMutationDtoSchema.parse(result.value),
          }
        : result
    },
  }
}

async function mapNodeMutation(
  repository: ResourceTreeRepository,
  result: Awaited<
    ReturnType<
      ResourceTreeRepository["moveNode"] | ResourceTreeRepository["renameNode"]
    >
  >
): Promise<ResourceTreeCommandResult<AdminResourceNodeMutationDto>> {
  if (result.kind !== "ok") {
    return result
  }

  const subtree = await repository.readSubtree(result.value.node.id)

  return {
    kind: "ok",
    value: adminResourceNodeMutationDtoSchema.parse({
      ...result.value,
      node: toTreeNodeDto(result.value.node, subtree.length > 1),
    }),
  }
}

function toRepositoryCommand(
  input: ResourceStructureCommandInput,
  auditEventId: ResourceAuditEventId
) {
  return {
    actorId: input.actorId,
    auditEventId,
    expectedRevision: input.expectedRevision,
    now: input.now,
  }
}

function toTreeNodeDto(
  node: ResourceTreeNode,
  hasChildren: boolean
): AdminResourceTreeNodeDto {
  return node.kind === "folder"
    ? {
        hasChildren,
        id: node.id,
        kind: node.kind,
        name: node.name,
        parentId: node.parentId,
        sortOrder: node.sortOrder,
        status: node.status,
      }
    : {
        hasChildren: false,
        id: node.id,
        kind: node.kind,
        name: node.name,
        parentId: node.parentId,
        sortOrder: node.sortOrder,
        status: node.status,
      }
}

function toParentId(parentId: string | null): ResourceFolderId | null {
  return parentId === null ? null : toResourceFolderId(parentId)
}
