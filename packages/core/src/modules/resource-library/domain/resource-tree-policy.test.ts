import { describe, expect, it } from "vitest"

import {
  archiveResourceSubtree,
  createAvailableResourceName,
  createResourceSortAssignments,
  normalizeResourceName,
  restoreResourceSubtree,
  validateResourceMove,
  validateResourceNameChange,
} from "#core/modules/resource-library/domain/resource-tree-policy"
import {
  toResourceDocumentId,
  toResourceFolderId,
  type ResourceTreeNode,
} from "#core/modules/resource-library/domain/resource-tree-node"

describe("자료 트리 도메인 정책", () => {
  it("이름의 앞뒤 공백과 대소문자를 정규화하고 빈 이름을 거부한다", () => {
    expect(normalizeResourceName("  계획서  ")).toEqual({
      name: "계획서",
      normalizedName: "계획서",
      status: "valid",
    })
    expect(normalizeResourceName("  ReSource  ")).toEqual({
      name: "ReSource",
      normalizedName: "resource",
      status: "valid",
    })
    expect(normalizeResourceName("   ")).toEqual({
      reason: "empty",
      status: "invalid",
    })
    expect(normalizeResourceName("여러\n줄")).toEqual({
      reason: "invalid-character",
      status: "invalid",
    })
  })

  it("생성과 복원 이름 충돌에 제한 없는 숫자 접미사를 적용한다", () => {
    expect(
      createAvailableResourceName("제목 없음", [
        "제목 없음",
        "제목 없음 (2)",
        "제목 없음 (3)",
      ])
    ).toEqual({
      name: "제목 없음 (4)",
      normalizedName: "제목 없음 (4)",
    })
    expect(
      createAvailableResourceName(`${"가".repeat(115)}👩‍💻`, [
        `${"가".repeat(115)}👩‍💻`.toLowerCase(),
      ]).name
    ).toBe(`${"가".repeat(115)} (2)`)
  })

  it("수동 이름 변경은 충돌을 자동 보정하지 않고 명시적으로 거부한다", () => {
    expect(
      validateResourceNameChange({
        currentNormalizedName: "초안",
        name: "  완성본 ",
        occupiedNormalizedNames: ["완성본"],
      })
    ).toEqual({ reason: "conflict", status: "invalid" })
    expect(
      validateResourceNameChange({
        currentNormalizedName: "초안",
        name: " 초안 ",
        occupiedNormalizedNames: ["초안"],
      })
    ).toEqual({
      name: "초안",
      normalizedName: "초안",
      status: "valid",
    })
  })

  it("자기 자신과 하위 폴더로 이동하는 순환을 거부한다", () => {
    const movingFolderId = toResourceFolderId("folder-moving")
    const childFolderId = toResourceFolderId("folder-child")

    expect(
      validateResourceMove({
        destinationAncestorIds: [],
        destinationParentId: movingFolderId,
        movingNodeId: movingFolderId,
      })
    ).toEqual({ reason: "cycle", status: "invalid" })
    expect(
      validateResourceMove({
        destinationAncestorIds: [movingFolderId],
        destinationParentId: childFolderId,
        movingNodeId: movingFolderId,
      })
    ).toEqual({ reason: "cycle", status: "invalid" })
    expect(
      validateResourceMove({
        destinationAncestorIds: [],
        destinationParentId: childFolderId,
        movingNodeId: toResourceDocumentId("document-moving"),
      })
    ).toEqual({ status: "valid" })
  })

  it("형제 순서를 0부터 연속된 불변 assignment로 만든다", () => {
    const first = toResourceFolderId("folder-first")
    const second = toResourceDocumentId("document-second")
    const orderedIds = [first, second] as const

    expect(createResourceSortAssignments(orderedIds)).toEqual([
      { nodeId: first, sortOrder: 0 },
      { nodeId: second, sortOrder: 1 },
    ])
    expect(orderedIds).toEqual([first, second])
  })

  it("하위 트리를 같은 trash root로 보관하고 원래 위치와 순서로 복원한다", () => {
    const rootFolderId = toResourceFolderId("folder-root")
    const childFolderId = toResourceFolderId("folder-child")
    const documentId = toResourceDocumentId("document-child")
    const nodes: readonly ResourceTreeNode[] = [
      createFolderNode({ id: rootFolderId, name: "기획", sortOrder: 3 }),
      createFolderNode({
        id: childFolderId,
        name: "하위 폴더",
        parentId: rootFolderId,
        sortOrder: 1,
      }),
      createDocumentNode({
        id: documentId,
        name: "문서",
        parentId: childFolderId,
        sortOrder: 2,
      }),
    ]

    const archived = archiveResourceSubtree(nodes, rootFolderId)

    expect(archived.status).toBe("valid")

    if (archived.status !== "valid") {
      throw new Error("유효한 하위 트리를 보관하지 못했습니다.")
    }

    expect(
      archived.nodes.map(({ id, status, trashRootId }) => ({
        id,
        status,
        trashRootId,
      }))
    ).toEqual([
      { id: rootFolderId, status: "archived", trashRootId: rootFolderId },
      { id: childFolderId, status: "archived", trashRootId: rootFolderId },
      { id: documentId, status: "archived", trashRootId: rootFolderId },
    ])

    const restored = restoreResourceSubtree({
      nodes: archived.nodes,
      occupiedTargetSiblingNormalizedNames: ["기획"],
      trashRootId: rootFolderId,
    })

    expect(restored.status).toBe("valid")

    if (restored.status !== "valid") {
      throw new Error("유효한 하위 트리를 복원하지 못했습니다.")
    }

    expect(
      restored.nodes.map(
        ({ id, name, parentId, sortOrder, status, trashRootId }) => ({
          id,
          name,
          parentId,
          sortOrder,
          status,
          trashRootId,
        })
      )
    ).toEqual([
      {
        id: rootFolderId,
        name: "기획 (2)",
        parentId: null,
        sortOrder: 3,
        status: "active",
        trashRootId: null,
      },
      {
        id: childFolderId,
        name: "하위 폴더",
        parentId: rootFolderId,
        sortOrder: 1,
        status: "active",
        trashRootId: null,
      },
      {
        id: documentId,
        name: "문서",
        parentId: childFolderId,
        sortOrder: 2,
        status: "active",
        trashRootId: null,
      },
    ])
  })

  it("연결되지 않았거나 중복된 node 집합은 하위 트리 전이로 처리하지 않는다", () => {
    const rootFolderId = toResourceFolderId("folder-root")
    const disconnectedFolderId = toResourceFolderId("folder-disconnected")
    const root = createFolderNode({
      id: rootFolderId,
      name: "루트",
      sortOrder: 0,
    })
    const disconnected = createFolderNode({
      id: disconnectedFolderId,
      name: "분리",
      sortOrder: 1,
    })

    expect(archiveResourceSubtree([root, disconnected], rootFolderId)).toEqual({
      reason: "invalid-subtree",
      status: "invalid",
    })
    expect(archiveResourceSubtree([root, root], rootFolderId)).toEqual({
      reason: "invalid-subtree",
      status: "invalid",
    })
  })
})

function createFolderNode({
  id,
  name,
  parentId = null,
  sortOrder,
}: {
  readonly id: ReturnType<typeof toResourceFolderId>
  readonly name: string
  readonly parentId?: ReturnType<typeof toResourceFolderId> | null
  readonly sortOrder: number
}): ResourceTreeNode {
  return {
    id,
    kind: "folder",
    name,
    normalizedName: name.toLowerCase(),
    parentId,
    sortOrder,
    status: "active",
    trashRootId: null,
  }
}

function createDocumentNode({
  id,
  name,
  parentId,
  sortOrder,
}: {
  readonly id: ReturnType<typeof toResourceDocumentId>
  readonly name: string
  readonly parentId: ReturnType<typeof toResourceFolderId>
  readonly sortOrder: number
}): ResourceTreeNode {
  return {
    id,
    kind: "document",
    name,
    normalizedName: name.toLowerCase(),
    parentId,
    sortOrder,
    status: "active",
    trashRootId: null,
  }
}
