import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ResourceTreeApi } from "@/features/resources/resource-library-api"
import { ResourceTree } from "@/features/resources/tree/resource-tree"
import type { AdminResourceTreeNode } from "@/lib/api/admin-api"

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}))

const folder: AdminResourceTreeNode = {
  hasChildren: true,
  id: "folder-1",
  kind: "folder",
  name: "운영 가이드",
  parentId: null,
  sortOrder: 0,
  status: "active",
}

const rootDocument: AdminResourceTreeNode = {
  hasChildren: false,
  id: "document-1",
  kind: "document",
  name: "시작 안내",
  parentId: null,
  sortOrder: 1,
  status: "active",
}

describe("자료 트리", () => {
  beforeEach(() => {
    localStorage.clear()
    pushMock.mockClear()
    refreshMock.mockClear()
  })

  it("최상위 자료는 사전 조회 결과를 사용하고 펼친 폴더만 지연 조회한다", async () => {
    const api = createResourceLibraryApi()
    vi.mocked(api.getResourceTree).mockResolvedValue({
      status: "ok",
      value: {
        nodes: [
          {
            hasChildren: false,
            id: "document-2",
            kind: "document",
            name: "하위 문서",
            parentId: folder.id,
            sortOrder: 0,
            status: "active",
          },
        ],
        revision: 2,
      },
    })

    render(
      <ResourceTree
        adminId="admin-1"
        api={api}
        initialTree={{
          status: "ok",
          value: { nodes: [folder, rootDocument], revision: 1 },
        }}
        onDocumentOpen={vi.fn()}
        scope="active"
      />
    )

    expect(await screen.findByText("운영 가이드")).toBeVisible()
    expect(screen.getByText("시작 안내")).toBeVisible()
    expect(api.getResourceTree).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText("운영 가이드"))

    expect(await screen.findByText("하위 문서")).toBeVisible()
    expect(api.getResourceTree).toHaveBeenCalledTimes(1)
    expect(api.getResourceTree).toHaveBeenCalledWith({
      parentId: "folder-1",
      scope: "active",
    })
    await waitFor(() => {
      expect(localStorage.getItem(expandedStorageKey)).toBe(
        JSON.stringify(["folder-1"])
      )
    })
  })

  it("선택한 폴더 아래에 새 문서를 만들고 바로 연다", async () => {
    const api = createResourceLibraryApi()
    vi.mocked(api.getResourceTree).mockResolvedValue({
      status: "ok",
      value: { nodes: [], revision: 2 },
    })
    vi.mocked(api.createResourceDocumentNode).mockResolvedValue({
      status: "ok",
      value: {
        affectedParentIds: [folder.id],
        node: {
          hasChildren: false,
          id: "document-new",
          kind: "document",
          name: "새 문서",
          parentId: folder.id,
          sortOrder: 0,
          status: "active",
        },
        revision: 3,
      },
    })

    render(
      <ResourceTree
        adminId="admin-2"
        api={api}
        initialTree={{ status: "ok", value: { nodes: [folder], revision: 1 } }}
        onDocumentOpen={vi.fn()}
        scope="active"
      />
    )

    fireEvent.click(await screen.findByText("운영 가이드"))
    await waitFor(() => {
      expect(api.getResourceTree).toHaveBeenCalledWith({
        parentId: folder.id,
        scope: "active",
      })
    })
    fireEvent.click(screen.getByRole("button", { name: "새 문서" }))

    await waitFor(() => {
      expect(api.createResourceDocumentNode).toHaveBeenCalledWith({
        expectedRevision: 2,
        parentId: folder.id,
      })
      expect(pushMock).toHaveBeenCalledWith("/resources/document-new")
    })
    expect(screen.getByText("새 문서", { selector: "span" })).toBeVisible()
  })

  it("선택한 폴더에 Markdown 단일 파일을 가져오고 문서를 연다", async () => {
    const api = createResourceLibraryApi()
    vi.mocked(api.getResourceTree).mockResolvedValue({
      status: "ok",
      value: { nodes: [], revision: 2 },
    })
    vi.mocked(api.importResourceDocument).mockResolvedValue({
      status: "ok",
      value: {
        document: {
          contentMarkdown: "가져온 본문",
          contentRevision: 0,
          createdAt: "2026-07-10T00:00:00.000Z",
          createdBy: {
            email: "admin@example.com",
            id: "admin-1",
            name: "관리자",
          },
          id: "document-import",
          name: "가져온 문서",
          parentId: folder.id,
          path: [{ id: folder.id, name: folder.name }],
          status: "active",
          updatedAt: "2026-07-10T00:00:00.000Z",
          updatedBy: {
            email: "admin@example.com",
            id: "admin-1",
            name: "관리자",
          },
        },
        mutation: {
          affectedParentIds: [folder.id],
          node: {
            hasChildren: false,
            id: "document-import",
            kind: "document",
            name: "가져온 문서",
            parentId: folder.id,
            sortOrder: 0,
            status: "active",
          },
          revision: 3,
        },
      },
    })
    const { container } = render(
      <ResourceTree
        adminId="admin-3"
        api={api}
        initialTree={{ status: "ok", value: { nodes: [folder], revision: 1 } }}
        onDocumentOpen={vi.fn()}
        scope="active"
      />
    )

    fireEvent.click(await screen.findByText("운영 가이드"))
    await waitFor(() => {
      expect(api.getResourceTree).toHaveBeenCalledWith({
        parentId: folder.id,
        scope: "active",
      })
    })
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')

    if (input === null) {
      throw new Error("Markdown 파일 입력을 찾지 못했습니다.")
    }

    fireEvent.change(input, {
      target: {
        files: [new File(["# 가져온 문서\n\n가져온 본문"], "가져오기.md")],
      },
    })

    await waitFor(() => {
      expect(api.importResourceDocument).toHaveBeenCalledWith({
        expectedRevision: 2,
        fileName: "가져오기.md",
        markdown: "# 가져온 문서\n\n가져온 본문",
        parentId: folder.id,
      })
      expect(pushMock).toHaveBeenCalledWith("/resources/document-import")
    })
    expect(screen.getByText("가져온 문서", { selector: "span" })).toBeVisible()
  })
})

const expandedStorageKey =
  "writing-app:resource-library:expanded:v1:admin-1:active"

function createResourceLibraryApi(): ResourceTreeApi {
  return {
    createResourceDocumentNode:
      vi.fn<ResourceTreeApi["createResourceDocumentNode"]>(),
    createResourceFolder: vi.fn<ResourceTreeApi["createResourceFolder"]>(),
    getResourceTree: vi.fn<ResourceTreeApi["getResourceTree"]>(),
    importResourceDocument: vi.fn<ResourceTreeApi["importResourceDocument"]>(),
    moveResourceNode: vi.fn<ResourceTreeApi["moveResourceNode"]>(),
    renameResourceNode: vi.fn<ResourceTreeApi["renameResourceNode"]>(),
    restoreResourceNode: vi.fn<ResourceTreeApi["restoreResourceNode"]>(),
    searchResources: vi.fn<ResourceTreeApi["searchResources"]>(),
    trashResourceNode: vi.fn<ResourceTreeApi["trashResourceNode"]>(),
  }
}
