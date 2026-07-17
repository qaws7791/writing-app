import type {
  AdminResourceTreeNodeDto,
  AdminResourceTreeScope,
} from "@workspace/contracts/admin/resource-library-data"

import type { ResourceTreeRepository } from "#core/modules/resource-library/application/ports/resource-tree.repository"
import type { ResourceTreeCommandResult } from "#core/modules/resource-library/application/resource-library-error"
import {
  toResourceFolderId,
  toResourceNodeId,
  type ResourceDocumentId,
  type ResourceFolderId,
  type ResourceTreeNode,
} from "#core/modules/resource-library/domain/resource-tree-node"

export type ResourceTreeCommandContext = {
  readonly actorId: string
  readonly now: Date
}

export type CreateResourceNodeCommand = ResourceTreeCommandContext & {
  readonly parentId: string | null
}

export type DeleteResourceNodeCommand = ResourceTreeCommandContext & {
  readonly nodeId: string
}

export type GetResourceTreeQuery = {
  readonly scope: AdminResourceTreeScope
}

export type MoveResourceNodeCommand = ResourceTreeCommandContext & {
  readonly destinationParentId: string | null
  readonly nodeId: string
}

export type RenameResourceFolderCommand = ResourceTreeCommandContext & {
  readonly folderId: string
  readonly name: string
}

export type ResourceNodeMutationResult = {
  readonly node: AdminResourceTreeNodeDto
}

export type ResourceTrashCommandValue = {
  readonly documentCount: number
  readonly folderCount: number
}

export type ResourceRestoreCommandValue = ResourceTrashCommandValue & {
  readonly node: AdminResourceTreeNodeDto
}

export type ResourcePermanentDeleteCommandValue = ResourceTrashCommandValue & {
  readonly r2ObjectKeys: readonly string[]
}

export type ResourceTreeQueryResult = {
  readonly nodes: readonly AdminResourceTreeNodeDto[]
}

export type ResourceTreeUseCase = {
  readonly createDocument: (
    command: CreateResourceNodeCommand
  ) => Promise<ResourceTreeCommandResult<ResourceNodeMutationResult>>
  readonly createFolder: (
    command: CreateResourceNodeCommand
  ) => Promise<ResourceTreeCommandResult<ResourceNodeMutationResult>>
  readonly deleteNodePermanently: (
    command: DeleteResourceNodeCommand
  ) => Promise<ResourceTreeCommandResult<ResourcePermanentDeleteCommandValue>>
  readonly getTree: (
    query: GetResourceTreeQuery
  ) => Promise<ResourceTreeQueryResult>
  readonly moveNode: (
    command: MoveResourceNodeCommand
  ) => Promise<ResourceTreeCommandResult<ResourceNodeMutationResult>>
  readonly renameFolder: (
    command: RenameResourceFolderCommand
  ) => Promise<ResourceTreeCommandResult<ResourceNodeMutationResult>>
  readonly restoreNode: (
    command: DeleteResourceNodeCommand
  ) => Promise<ResourceTreeCommandResult<ResourceRestoreCommandValue>>
  readonly trashNode: (
    command: DeleteResourceNodeCommand
  ) => Promise<ResourceTreeCommandResult<ResourceTrashCommandValue>>
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
      return {
        nodes: nodes.map(({ hasChildren, node }) =>
          toTreeNodeData(node, hasChildren)
        ),
      }
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
            value: {
              ...result.value,
              node: toTreeNodeData(
                result.value.node,
                result.value.folderCount + result.value.documentCount > 1
              ),
            },
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
            value: result.value,
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
): ResourceTreeCommandResult<ResourceNodeMutationResult> {
  return result.kind === "ok"
    ? {
        kind: "ok",
        value: { node: toTreeNodeData(result.value.node, false) },
      }
    : result
}

function toTreeNodeData(
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
