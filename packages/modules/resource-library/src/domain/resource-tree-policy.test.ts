import { describe, expect, it } from "vitest"

import {
  createAvailableResourceName,
  normalizeResourceName,
  restoreResourceSubtree,
  sortResourceTreeEntries,
  trashResourceSubtree,
  validateResourceMove,
} from "#resource-library/domain/resource-tree-policy"
import {
  readResourceDocumentId,
  readResourceFolderId,
} from "#resource-library/domain/resource-tree-node"

const rootId = readResourceFolderId("folder-root")
const childId = readResourceFolderId("folder-child")
const documentId = readResourceDocumentId("document-1")
const activeTree = Object.freeze([
  Object.freeze({
    id: rootId,
    kind: "folder" as const,
    name: "운영 자료",
    normalizedName: "운영 자료",
    parentId: null,
    status: "active" as const,
    trashRootId: null,
  }),
  Object.freeze({
    id: childId,
    kind: "folder" as const,
    name: "문장",
    normalizedName: "문장",
    parentId: rootId,
    status: "active" as const,
    trashRootId: null,
  }),
  Object.freeze({
    id: documentId,
    kind: "document" as const,
    name: "예시",
    normalizedName: "예시",
    parentId: childId,
    status: "active" as const,
    trashRootId: null,
  }),
] as const)

describe("resource tree domain policy", () => {
  it("대소문자·공백을 정규화하고 충돌 없는 결정적 접미사를 만든다", () => {
    expect(normalizeResourceName("  Guide  ")).toEqual({
      name: "Guide",
      normalizedName: "guide",
      status: "valid",
    })
    expect(
      createAvailableResourceName("Guide", ["guide", "guide (2)"])
    ).toEqual({ name: "Guide (3)", normalizedName: "guide (3)" })
  })

  it("자기 자신과 하위 폴더로 이동하는 cycle을 거절한다", () => {
    expect(
      validateResourceMove({
        destinationAncestorIds: [],
        destinationParentId: rootId,
        movingNodeId: rootId,
      })
    ).toEqual({ reason: "cycle", status: "invalid" })
    expect(
      validateResourceMove({
        destinationAncestorIds: [rootId, childId],
        destinationParentId: childId,
        movingNodeId: rootId,
      })
    ).toEqual({ reason: "cycle", status: "invalid" })
  })

  it("연결된 하위 트리만 같은 trash root로 전이하고 전체를 복원한다", () => {
    const trashed = trashResourceSubtree(activeTree, rootId)
    expect(trashed.status).toBe("valid")
    if (trashed.status !== "valid") return
    expect(
      trashed.nodes.every(
        (node) => node.status === "trashed" && node.trashRootId === rootId
      )
    ).toBe(true)
    expect(activeTree.every((node) => node.status === "active")).toBe(true)

    const restored = restoreResourceSubtree({
      nodes: trashed.nodes,
      occupiedTargetSiblingNormalizedNames: ["운영 자료"],
      trashRootId: rootId,
    })
    expect(restored.status).toBe("valid")
    if (restored.status !== "valid") return
    expect(restored.nodes[0]).toMatchObject({
      name: "운영 자료 (2)",
      status: "active",
      trashRootId: null,
    })
    expect(
      restored.nodes.slice(1).every((node) => node.status === "active")
    ).toBe(true)
  })

  it("끊어진 subtree를 fail-closed하고 이름·ID 순으로 결정적으로 정렬한다", () => {
    expect(trashResourceSubtree(activeTree.slice(0, 2), childId)).toEqual({
      reason: "invalid-subtree",
      status: "invalid",
    })

    const sorted = sortResourceTreeEntries([
      { hasChildren: false, node: activeTree[2] },
      { hasChildren: true, node: activeTree[0] },
      { hasChildren: true, node: activeTree[1] },
    ])
    expect(sorted.map(({ node }) => node.id)).toEqual([
      childId,
      documentId,
      rootId,
    ])
  })
})
