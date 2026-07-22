import type { ResourceTreeRepository } from "#resource-library/application/ports/resource-library-ports"
import { readResourceFolderId } from "#resource-library/domain/resource-tree-node"

const defaultNode = Object.freeze({
  id: readResourceFolderId("folder-1"),
  kind: "folder" as const,
  name: "운영 자료",
  normalizedName: "운영 자료",
  parentId: null,
  status: "active" as const,
  trashRootId: null,
})

export function createResourceTreeRepositoryFake(
  overrides: Partial<ResourceTreeRepository> = {}
): ResourceTreeRepository {
  return {
    completePermanentDelete: async () => ({ kind: "ok", value: undefined }),
    createNode: async () => ({ kind: "ok", value: { node: defaultNode } }),
    moveNode: async () => ({ kind: "ok", value: { node: defaultNode } }),
    preparePermanentDelete: async (input) => ({
      kind: "ok",
      value: {
        assets: [],
        documentCount: 0,
        folderCount: 1,
        rootId: input.nodeId,
      },
    }),
    readPendingAssetDeletions: async () => [],
    readSubtree: async () => [defaultNode],
    readTree: async () => [{ hasChildren: false, node: defaultNode }],
    renameFolder: async () => ({
      kind: "ok",
      value: { node: defaultNode },
    }),
    restoreNode: async () => ({
      kind: "ok",
      value: { documentCount: 0, folderCount: 1, node: defaultNode },
    }),
    trashNode: async () => ({
      kind: "ok",
      value: { documentCount: 0, folderCount: 1 },
    }),
    ...overrides,
  }
}
