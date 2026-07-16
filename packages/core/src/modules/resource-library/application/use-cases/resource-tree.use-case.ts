import {
  adminResourceNodeMutationDtoSchema,
  adminResourceRestoreResultDtoSchema,
  adminResourceTrashResultDtoSchema,
  adminResourceTreeDtoSchema,
  type AdminResourceNodeMutationDto,
  type AdminResourceRestoreResultDto,
  type AdminResourceTrashResultDto,
  type AdminResourceTreeDto,
  type AdminResourceTreeNodeDto,
  type AdminResourceTreeScope,
} from "@workspace/contracts/admin"

import type {
  ResourcePermanentDeleteResult,
  ResourceTreeCommandResult,
  ResourceTreeRepository,
} from "#core/modules/resource-library/application/ports/resource-tree.repository"
import {
  toResourceFolderId,
  toResourceNodeId,
  type ResourceDocumentId,
  type ResourceFolderId,
  type ResourceTreeNode,
} from "#core/modules/resource-library/domain/resource-tree-node"

type ResourceCommandInput = {
  readonly actorId: string
  readonly now: Date
}

export type ResourceTreeUseCase = {
  readonly createDocument: (
    input: ResourceCommandInput & { readonly parentId: string | null }
  ) => Promise<ResourceTreeCommandResult<AdminResourceNodeMutationDto>>
  readonly createFolder: (
    input: ResourceCommandInput & { readonly parentId: string | null }
  ) => Promise<ResourceTreeCommandResult<AdminResourceNodeMutationDto>>
  readonly deleteNodePermanently: (
    input: ResourceCommandInput & { readonly nodeId: string }
  ) => Promise<ResourcePermanentDeleteResult>
  readonly getTree: (input: {
    readonly scope: AdminResourceTreeScope
  }) => Promise<AdminResourceTreeDto>
  readonly moveNode: (
    input: ResourceCommandInput & {
      readonly destinationParentId: string | null
      readonly nodeId: string
    }
  ) => Promise<ResourceTreeCommandResult<AdminResourceNodeMutationDto>>
  readonly renameFolder: (
    input: ResourceCommandInput & {
      readonly folderId: string
      readonly name: string
    }
  ) => Promise<ResourceTreeCommandResult<AdminResourceNodeMutationDto>>
  readonly restoreNode: (
    input: ResourceCommandInput & { readonly nodeId: string }
  ) => Promise<ResourceTreeCommandResult<AdminResourceRestoreResultDto>>
  readonly trashNode: (
    input: ResourceCommandInput & { readonly nodeId: string }
  ) => Promise<ResourceTreeCommandResult<AdminResourceTrashResultDto>>
}

export type ResourceTreeUseCaseDependencies = {
  readonly createDocumentId: () => ResourceDocumentId
  readonly createFolderId: () => ResourceFolderId
  readonly treeRepository: ResourceTreeRepository
}

export function createResourceTreeUseCase({
  createDocumentId,
  createFolderId,
  treeRepository,
}: ResourceTreeUseCaseDependencies): ResourceTreeUseCase {
  return {
    async createDocument(input) {
      return mapNodeResult(
        await treeRepository.createNode({
          ...input,
          kind: "document",
          nodeId: createDocumentId(),
          parentId: toParentId(input.parentId),
          preferredName: "제목 없음",
        })
      )
    },
    async createFolder(input) {
      return mapNodeResult(
        await treeRepository.createNode({
          ...input,
          kind: "folder",
          nodeId: createFolderId(),
          parentId: toParentId(input.parentId),
          preferredName: "새 폴더",
        })
      )
    },
    async deleteNodePermanently(input) {
      return treeRepository.deleteNodePermanently({
        ...input,
        nodeId: toResourceNodeId(input.nodeId),
      })
    },
    async getTree({ scope }) {
      const nodes = await treeRepository.readTree(scope)
      return adminResourceTreeDtoSchema.parse({
        nodes: nodes.map(({ hasChildren, node }) =>
          toTreeNodeDto(node, hasChildren)
        ),
      })
    },
    async moveNode(input) {
      return mapNodeResult(
        await treeRepository.moveNode({
          ...input,
          destinationParentId: toParentId(input.destinationParentId),
          nodeId: toResourceNodeId(input.nodeId),
        })
      )
    },
    async renameFolder(input) {
      return mapNodeResult(
        await treeRepository.renameFolder({
          ...input,
          folderId: toResourceFolderId(input.folderId),
        })
      )
    },
    async restoreNode(input) {
      const result = await treeRepository.restoreNode({
        ...input,
        nodeId: toResourceNodeId(input.nodeId),
      })
      return result.kind === "ok"
        ? {
            kind: "ok",
            value: adminResourceRestoreResultDtoSchema.parse({
              ...result.value,
              node: toTreeNodeDto(
                result.value.node,
                result.value.folderCount + result.value.documentCount > 1
              ),
            }),
          }
        : result
    },
    async trashNode(input) {
      const result = await treeRepository.trashNode({
        ...input,
        nodeId: toResourceNodeId(input.nodeId),
      })
      return result.kind === "ok"
        ? {
            kind: "ok",
            value: adminResourceTrashResultDtoSchema.parse(result.value),
          }
        : result
    },
  }
}

function mapNodeResult(
  result: Awaited<
    ReturnType<
      | ResourceTreeRepository["createNode"]
      | ResourceTreeRepository["moveNode"]
      | ResourceTreeRepository["renameFolder"]
    >
  >
): ResourceTreeCommandResult<AdminResourceNodeMutationDto> {
  return result.kind === "ok"
    ? {
        kind: "ok",
        value: adminResourceNodeMutationDtoSchema.parse({
          node: toTreeNodeDto(result.value.node, false),
        }),
      }
    : result
}

function toTreeNodeDto(
  node: ResourceTreeNode,
  hasChildren: boolean
): AdminResourceTreeNodeDto {
  return node.kind === "folder"
    ? {
        hasChildren,
        id: node.id,
        kind: "folder",
        name: node.name,
        parentId: node.parentId,
        status: node.status,
      }
    : {
        hasChildren: false,
        id: node.id,
        kind: "document",
        name: node.name,
        parentId: node.parentId,
        status: node.status,
      }
}

function toParentId(parentId: string | null): ResourceFolderId | null {
  return parentId === null ? null : toResourceFolderId(parentId)
}
