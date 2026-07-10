import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ResourceTreeApi } from "@/features/resources/resource-library-api"
import { ResourceTreeActionDialog } from "@/features/resources/tree/resource-tree-actions"
import type { AdminResourceTreeNode } from "@/lib/api/admin-api"

const documentNode: AdminResourceTreeNode = {
  hasChildren: false,
  id: "document-1",
  kind: "document",
  name: "시작 안내",
  parentId: null,
  sortOrder: 0,
  status: "active",
}

describe("자료 트리 대화상자 접근성 이름", () => {
  it("이름 변경 대화상자와 입력 이름을 한국어로 제공한다", () => {
    renderDialog("rename")

    expect(screen.getByRole("dialog", { name: "이름 변경" })).toBeVisible()
    expect(screen.getByRole("textbox", { name: "새 이름" })).toBeVisible()
  })

  it("이동 대화상자와 폴더 검색 이름을 한국어로 제공한다", () => {
    renderDialog("move")

    expect(screen.getByRole("dialog", { name: "시작 안내 이동" })).toBeVisible()
    expect(
      screen.getByRole("textbox", { name: "이동할 폴더 검색" })
    ).toBeVisible()
  })

  it("휴지통 대화상자와 활성 편집자 수를 한국어로 제공한다", async () => {
    const api = createApi()

    vi.mocked(api.getResourceActiveEditorCount).mockResolvedValue({
      status: "ok",
      value: { activeEditorCount: 0 },
    })
    renderDialog("trash", api)

    expect(
      screen.getByRole("alertdialog", { name: "휴지통으로 이동할까요?" })
    ).toBeVisible()
    expect(
      await screen.findByRole("status", {
        name: "현재 공동 편집 중인 관리자 0명",
      })
    ).toBeVisible()
  })

  it("복원 대화상자 이름을 한국어로 제공한다", () => {
    renderDialog("restore")

    expect(
      screen.getByRole("alertdialog", { name: "자료를 복원할까요?" })
    ).toBeVisible()
  })
})

function renderDialog(
  action: "move" | "rename" | "restore" | "trash",
  api = createApi()
): void {
  render(
    <ResourceTreeActionDialog
      action={action}
      api={api}
      node={documentNode}
      onClose={vi.fn()}
      onMove={vi.fn(async () => null)}
      onRename={vi.fn(async () => null)}
      onRestore={vi.fn(async () => null)}
      onTrash={vi.fn(async () => null)}
    />
  )
}

function createApi(): ResourceTreeApi {
  return {
    createResourceDocumentNode:
      vi.fn<ResourceTreeApi["createResourceDocumentNode"]>(),
    createResourceFolder: vi.fn<ResourceTreeApi["createResourceFolder"]>(),
    getResourceActiveEditorCount:
      vi.fn<ResourceTreeApi["getResourceActiveEditorCount"]>(),
    getResourceTree: vi.fn<ResourceTreeApi["getResourceTree"]>(),
    importResourceDocument: vi.fn<ResourceTreeApi["importResourceDocument"]>(),
    moveResourceNode: vi.fn<ResourceTreeApi["moveResourceNode"]>(),
    renameResourceNode: vi.fn<ResourceTreeApi["renameResourceNode"]>(),
    restoreResourceNode: vi.fn<ResourceTreeApi["restoreResourceNode"]>(),
    searchResources: vi.fn<ResourceTreeApi["searchResources"]>(),
    trashResourceNode: vi.fn<ResourceTreeApi["trashResourceNode"]>(),
  }
}
