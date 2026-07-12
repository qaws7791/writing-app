import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ResourceWorkspace } from "@/features/resources/resource-workspace"
import { readAdminApiBaseUrl } from "@/runtime-config"
import { adminIdSchema } from "@/lib/api/admin-identity"

const {
  checkActiveDocumentMock,
  connectEventsMock,
  createWorkspaceSyncMock,
  paramsMock,
} = vi.hoisted(() => ({
  checkActiveDocumentMock: vi.fn(),
  connectEventsMock: vi.fn(() => ({
    disconnect: vi.fn(),
    subscribeDocument: vi.fn(),
    unsubscribeDocument: vi.fn(),
  })),
  createWorkspaceSyncMock: vi.fn(),
  paramsMock: vi.fn((): { readonly documentId?: string } => ({})),
}))

vi.mock("next/navigation", () => ({
  useParams: paramsMock,
  usePathname: () => "/resources",
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@/features/resources/resource-library-api", () => ({
  createBrowserResourceLibraryApi: () => ({}),
}))

vi.mock("@/features/resources/resource-events-client", () => ({
  connectBrowserResourceEvents: connectEventsMock,
}))

vi.mock("@/features/resources/resource-workspace-sync", () => ({
  createResourceWorkspaceSync: createWorkspaceSyncMock,
}))

vi.mock("@/features/resources/tree/resource-tree", () => ({
  ResourceTree: ({
    onDocumentOpen,
    toolbarEnd,
  }: {
    readonly onDocumentOpen: () => void
    readonly toolbarEnd?: ReactNode
  }) => (
    <div>
      {toolbarEnd}
      <button onClick={onDocumentOpen} type="button">
        문서 열기
      </button>
    </div>
  ),
}))

vi.mock("@workspace/ui/components/ui/drawer", () => ({
  Drawer: ({
    children,
    onOpenChange,
    open,
  }: {
    readonly children: ReactNode
    readonly onOpenChange: (open: boolean) => void
    readonly open: boolean
  }) =>
    open ? (
      <div>
        {children}
        <button onClick={() => onOpenChange(false)} type="button">
          drawer 닫기
        </button>
      </div>
    ) : null,
  DrawerContent: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerHeader: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}))

vi.mock("@workspace/ui/components/ui/resizable", () => ({
  ResizableHandle: () => <div />,
  ResizablePanel: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
  ResizablePanelGroup: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}))

const apiBaseUrl = readAdminApiBaseUrl({
  ADMIN_API_BASE_URL: "http://admin-api.test",
})
const initialTree = {
  status: "ok" as const,
  value: { nodes: [], revision: 0 },
}

describe("자료실 반응형 shell 포커스", () => {
  beforeEach(() => {
    checkActiveDocumentMock.mockClear()
    connectEventsMock.mockClear()
    createWorkspaceSyncMock.mockReset()
    createWorkspaceSyncMock.mockReturnValue({
      attachDocument: vi.fn(),
      checkActiveDocument: checkActiveDocumentMock,
      dispose: vi.fn(),
      start: vi.fn(),
    })
    paramsMock.mockReturnValue({})
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      return window.setTimeout(() => {
        callback(performance.now())
      }, 0)
    })
  })

  it("모바일 트리에서 문서를 열면 drawer를 닫고 열기 버튼에 포커스를 돌린다", async () => {
    installMatchMedia(false)
    renderWorkspace()
    const trigger = await screen.findByRole("button", {
      name: "자료 트리 열기",
    })

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole("button", { name: "문서 열기" }))

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "문서 열기" })).toBeNull()
      expect(trigger).toHaveFocus()
    })
  })

  it("모바일 drawer 자체를 닫아도 열기 버튼에 포커스를 돌린다", async () => {
    installMatchMedia(false)
    renderWorkspace()
    const trigger = await screen.findByRole("button", {
      name: "자료 트리 열기",
    })

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole("button", { name: "drawer 닫기" }))

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "drawer 닫기" })).toBeNull()
      expect(trigger).toHaveFocus()
    })
  })

  it("데스크톱 자료 트리를 접고 펼칠 때 새 제어 버튼으로 포커스를 옮긴다", async () => {
    installMatchMedia(true)
    renderWorkspace()

    fireEvent.click(
      await screen.findByRole("button", { name: "자료 트리 접기" })
    )
    const expand = await screen.findByRole("button", {
      name: "자료 트리 펼치기",
    })
    expect(expand).toHaveFocus()

    fireEvent.click(expand)
    expect(
      await screen.findByRole("button", { name: "자료 트리 접기" })
    ).toHaveFocus()
  })

  it("자료 트리를 접고 펼쳐도 작업 공간 실시간 연결을 하나만 유지한다", async () => {
    installMatchMedia(true)
    renderWorkspace()

    expect(connectEventsMock).toHaveBeenCalledTimes(1)
    fireEvent.click(
      await screen.findByRole("button", { name: "자료 트리 접기" })
    )
    fireEvent.click(
      await screen.findByRole("button", { name: "자료 트리 펼치기" })
    )

    expect(connectEventsMock).toHaveBeenCalledTimes(1)
  })

  it("문서를 선택하지 않은 자료실 shell은 문서 동기화 모듈을 만들지 않는다", async () => {
    installMatchMedia(true)
    renderWorkspace()

    await screen.findByText("문서 영역")
    expect(createWorkspaceSyncMock).not.toHaveBeenCalled()
  })

  it("숨겨졌던 탭이 다시 보이면 활성 문서 version을 확인한다", async () => {
    installMatchMedia(true)
    paramsMock.mockReturnValue({ documentId: "document-1" })
    renderWorkspace()
    await screen.findByText("문서 영역")
    await waitFor(() => expect(createWorkspaceSyncMock).toHaveBeenCalledOnce())

    setDocumentVisibility("hidden")
    fireEvent(document, new Event("visibilitychange"))
    expect(checkActiveDocumentMock).not.toHaveBeenCalled()

    setDocumentVisibility("visible")
    fireEvent(document, new Event("visibilitychange"))
    expect(checkActiveDocumentMock).toHaveBeenCalledTimes(1)
  })
})

function renderWorkspace(): void {
  render(
    <ResourceWorkspace
      adminId={adminIdSchema.parse("admin-1")}
      apiBaseUrl={apiBaseUrl}
      initialTree={initialTree}
    >
      <div>문서 영역</div>
    </ResourceWorkspace>
  )
}

function installMatchMedia(matches: boolean): void {
  vi.stubGlobal("matchMedia", undefined)
  window.matchMedia = () => ({
    addEventListener() {},
    addListener() {},
    dispatchEvent: () => true,
    matches,
    media: "(min-width: 768px)",
    onchange: null,
    removeEventListener() {},
    removeListener() {},
  })
}

function setDocumentVisibility(visibilityState: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visibilityState,
  })
}
