import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ResourceTreeApi } from "@/features/resources/resource-library-api"
import type { ResourceEventsConnector } from "@/features/resources/resource-events-client"
import { ResourceTree } from "@/features/resources/tree/resource-tree"
import type {
  AdminResourceEvent,
  AdminResourceTreeNode,
} from "@/lib/api/admin-api"

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
        connectEvents={connectTestResourceEvents}
        eventsServerUrl="ws://admin-api.test/resources/events"
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
        connectEvents={connectTestResourceEvents}
        eventsServerUrl="ws://admin-api.test/resources/events"
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
        connectEvents={connectTestResourceEvents}
        eventsServerUrl="ws://admin-api.test/resources/events"
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

  it("다른 관리자가 확정한 문서 제목을 현재 트리에 반영한다", async () => {
    const api = createResourceLibraryApi()
    const events = createResourceEventsFixture()

    render(
      <ResourceTree
        adminId="admin-4"
        api={api}
        connectEvents={events.connector}
        eventsServerUrl="ws://admin-api.test/resources/events"
        initialTree={{
          status: "ok",
          value: { nodes: [rootDocument], revision: 1 },
        }}
        onDocumentOpen={vi.fn()}
        scope="active"
      />
    )

    act(() => {
      events.emit({
        documentId: rootDocument.id,
        name: "변경된 시작 안내",
        revision: 1,
        type: "resource-document-title-confirmed",
      })
    })

    expect(await screen.findByText("변경된 시작 안내")).toBeVisible()
  })

  it("tree revision gap을 감지하면 보이는 트리를 서버에서 다시 조회한다", async () => {
    const api = createResourceLibraryApi()
    const events = createResourceEventsFixture()
    const recordRevisionGap = vi.fn()
    const renamedDocument = { ...rootDocument, name: "건너뛴 변경 반영" }

    vi.mocked(api.getResourceTree).mockImplementation(async ({ parentId }) => ({
      status: "ok",
      value: {
        nodes: parentId === null ? [folder, renamedDocument] : [],
        revision: 3,
      },
    }))

    render(
      <ResourceTree
        adminId="admin-5"
        api={api}
        connectEvents={events.connector}
        eventsServerUrl="ws://admin-api.test/resources/events"
        initialTree={{
          status: "ok",
          value: { nodes: [folder, rootDocument], revision: 1 },
        }}
        onDocumentOpen={vi.fn()}
        recordRevisionGap={recordRevisionGap}
        scope="active"
      />
    )

    act(() => {
      events.emit({
        action: "rename",
        affectedParentIds: [null],
        nodeId: rootDocument.id,
        revision: 3,
        type: "resource-tree-mutated",
      })
    })

    expect(await screen.findByText("건너뛴 변경 반영")).toBeVisible()
    expect(api.getResourceTree).toHaveBeenCalledWith({
      parentId: null,
      scope: "active",
    })
    expect(recordRevisionGap).toHaveBeenCalledWith({
      currentRevision: 1,
      incomingRevision: 3,
    })
  })

  it("휴지통 확인창에 하위 문서의 활성 편집자 수를 항상 표시한다", async () => {
    const api = createResourceLibraryApi()

    vi.mocked(api.getResourceActiveEditorCount).mockResolvedValue({
      status: "ok",
      value: { activeEditorCount: 2 },
    })

    render(
      <ResourceTree
        adminId="admin-6"
        api={api}
        connectEvents={connectTestResourceEvents}
        eventsServerUrl="ws://admin-api.test/resources/events"
        initialTree={{
          status: "ok",
          value: { nodes: [rootDocument], revision: 1 },
        }}
        onDocumentOpen={vi.fn()}
        scope="active"
      />
    )

    fireEvent.click(await screen.findByRole("button", { name: "자료 메뉴" }))
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "휴지통으로 이동" })
    )

    expect(
      await screen.findByText("현재 공동 편집 중인 관리자 2명")
    ).toBeVisible()
    expect(api.getResourceActiveEditorCount).toHaveBeenCalledWith(
      rootDocument.id
    )
  })

  it("공동 편집 연결이 끊기면 탐색은 유지하고 구조 변경 행동을 막는다", async () => {
    const api = createResourceLibraryApi()

    render(
      <ResourceTree
        adminId="admin-7"
        api={api}
        connectEvents={connectTestResourceEvents}
        eventsServerUrl="ws://admin-api.test/resources/events"
        initialTree={{
          status: "ok",
          value: { nodes: [rootDocument], revision: 1 },
        }}
        onDocumentOpen={vi.fn()}
        scope="active"
        structureChangesAllowed={false}
      />
    )

    expect(await screen.findByText(rootDocument.name)).toBeVisible()
    expect(
      screen.getByText(
        "공동 편집 연결이 복구될 때까지 자료 구조를 변경할 수 없습니다."
      )
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "새 문서" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "새 폴더" })).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Markdown 파일 가져오기" })
    ).toBeDisabled()
    expect(
      screen.queryByRole("button", { name: "자료 메뉴" })
    ).not.toBeInTheDocument()
  })

  it("자료 event 연결이 끊겨도 구조 변경 행동을 막는다", async () => {
    const api = createResourceLibraryApi()
    const connectDisconnectedEvents: ResourceEventsConnector = (input) => {
      input.onConnectionChange(false)
      return { disconnect() {} }
    }

    render(
      <ResourceTree
        adminId="admin-8"
        api={api}
        connectEvents={connectDisconnectedEvents}
        eventsServerUrl="ws://admin-api.test/resources/events"
        initialTree={{
          status: "ok",
          value: { nodes: [rootDocument], revision: 1 },
        }}
        onDocumentOpen={vi.fn()}
        scope="active"
      />
    )

    expect(
      await screen.findByText(
        "자료실 실시간 연결이 복구될 때까지 자료 구조를 변경할 수 없습니다."
      )
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "새 문서" })).toBeDisabled()
  })
})

const expandedStorageKey =
  "writing-app:resource-library:expanded:v1:admin-1:active"

function createResourceLibraryApi(): ResourceTreeApi {
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

const connectTestResourceEvents: ResourceEventsConnector = (input) => {
  input.onConnectionChange(true)
  return { disconnect() {} }
}

function createResourceEventsFixture(): {
  readonly connector: ResourceEventsConnector
  readonly emit: (event: AdminResourceEvent) => void
} {
  let onEvent: ((event: AdminResourceEvent) => void) | null = null

  return {
    connector(input) {
      input.onConnectionChange(true)
      onEvent = input.onEvent
      return { disconnect() {} }
    },
    emit(event) {
      if (onEvent === null) {
        throw new Error("자료실 이벤트 fixture가 연결되지 않았습니다.")
      }

      onEvent(event)
    },
  }
}
