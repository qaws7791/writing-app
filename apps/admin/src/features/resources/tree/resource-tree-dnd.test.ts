import { describe, expect, it } from "vitest"

import {
  canDragResourceTreeItem,
  canDropResourceTreeItem,
  moveResourceIdOptimistically,
  readResourceMoveDestination,
  resourceTreeRootId,
  type ResourceTreeDropItem,
} from "@/features/resources/tree/resource-tree-dnd"

describe("자료 트리 drag and drop", () => {
  it.each([
    {
      allowed: true,
      input: {
        itemCount: 1,
        itemKind: "document" as const,
        mutationInFlight: false,
        scope: "active" as const,
        structureMutationsAllowed: true,
      },
      name: "온라인 활성 문서 한 개",
    },
    {
      allowed: false,
      input: {
        itemCount: 1,
        itemKind: "folder" as const,
        mutationInFlight: true,
        scope: "active" as const,
        structureMutationsAllowed: true,
      },
      name: "다른 mutation 진행 중",
    },
    {
      allowed: false,
      input: {
        itemCount: 1,
        itemKind: "folder" as const,
        mutationInFlight: false,
        scope: "trash" as const,
        structureMutationsAllowed: true,
      },
      name: "휴지통 범위",
    },
    {
      allowed: false,
      input: {
        itemCount: 2,
        itemKind: "document" as const,
        mutationInFlight: false,
        scope: "active" as const,
        structureMutationsAllowed: true,
      },
      name: "복수 선택",
    },
  ])("$name drag 허용 여부를 계산한다", ({ allowed, input }) => {
    expect(canDragResourceTreeItem(input)).toBe(allowed)
  })

  it.each([
    {
      allowed: true,
      targetIsFolder: false,
      targetKind: "ordered" as const,
    },
    {
      allowed: true,
      targetIsFolder: true,
      targetKind: "parent" as const,
    },
    {
      allowed: false,
      targetIsFolder: false,
      targetKind: "parent" as const,
    },
  ])(
    "$targetKind target과 folder=$targetIsFolder의 drop 허용 여부를 계산한다",
    ({ allowed, targetIsFolder, targetKind }) => {
      expect(
        canDropResourceTreeItem({
          itemCount: 1,
          itemKind: "document",
          scope: "active",
          structureMutationsAllowed: true,
          targetIsFolder,
          targetKind,
        })
      ).toBe(allowed)
    }
  )

  it("루트·폴더의 정렬 위치와 폴더 내부 마지막 위치를 서버 명령으로 변환한다", () => {
    const root = item(resourceTreeRootId, true, [item("folder-1", true)])
    const folder = item("folder-1", true, [item("document-1", false)])

    expect(
      readResourceMoveDestination({
        insertionIndex: 1,
        item: root,
        kind: "ordered",
      })
    ).toEqual({ destinationIndex: 1, destinationParentId: null })
    expect(
      readResourceMoveDestination({ item: folder, kind: "parent" })
    ).toEqual({ destinationIndex: 1, destinationParentId: "folder-1" })
    expect(
      readResourceMoveDestination({
        item: item("document-1", false),
        kind: "parent",
      })
    ).toBeNull()
  })

  it("같은 부모 재정렬과 다른 부모 이동의 optimistic 자식 목록을 불변으로 계산한다", () => {
    const sourceIds = ["a", "b", "c"]

    expect(
      moveResourceIdOptimistically({
        destinationIds: sourceIds,
        destinationIndex: 2,
        movingId: "a",
        sameParent: true,
        sourceIds,
      })
    ).toEqual({
      destinationIds: ["b", "c", "a"],
      sourceIds: ["b", "c", "a"],
    })
    expect(
      moveResourceIdOptimistically({
        destinationIds: ["d"],
        destinationIndex: 0,
        movingId: "b",
        sameParent: false,
        sourceIds,
      })
    ).toEqual({ destinationIds: ["b", "d"], sourceIds: ["a", "c"] })
    expect(sourceIds).toEqual(["a", "b", "c"])
  })
})

function item(
  id: string,
  folder: boolean,
  children: readonly ResourceTreeDropItem[] = []
): ResourceTreeDropItem {
  return {
    getChildren: () => children,
    getId: () => id,
    isFolder: () => folder,
  }
}
