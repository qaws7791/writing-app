import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import ResourceLayout from "@/app/(admin)/resources/layout"
import type { InitialResourceTreeState } from "@/features/resources/tree/resource-tree"

const { getResourceTreeMock, getSessionMock, redirectMock } = vi.hoisted(
  () => ({
    getResourceTreeMock: vi.fn(),
    getSessionMock: vi.fn(),
    redirectMock: vi.fn((path: string) => {
      throw new Error(`redirect:${path}`)
    }),
  })
)

vi.mock("next/navigation", () => ({ redirect: redirectMock }))

vi.mock("@/lib/auth/server-admin-session-token", () => ({
  getServerAdminSessionToken: vi.fn(async () => "admin-token"),
}))

vi.mock("@/lib/api/get-server-admin-api", () => ({
  getServerAdminApi: vi.fn(() => ({
    getResourceTree: getResourceTreeMock,
    getSession: getSessionMock,
  })),
}))

vi.mock("@/runtime-config", () => ({
  readAdminApiBaseUrl: () => "http://admin-api.test",
}))

vi.mock("@/features/resources/resource-workspace", () => ({
  ResourceWorkspace({
    adminId,
    children,
    initialTree,
  }: {
    readonly adminId: string
    readonly children: ReactNode
    readonly initialTree: InitialResourceTreeState
  }) {
    return (
      <section
        aria-label="자료실 작업 공간"
        data-admin-id={adminId}
        data-tree-status={initialTree.status}
      >
        {children}
      </section>
    )
  },
}))

describe("자료실 layout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSessionMock.mockResolvedValue({
      status: "ok",
      value: {
        admin: {
          email: "admin@example.com",
          id: "admin-1",
          name: "관리자",
          role: "owner",
        },
      },
    })
    getResourceTreeMock.mockResolvedValue({
      status: "ok",
      value: { nodes: [], revision: 4 },
    })
  })

  it("세션과 최상위 트리를 함께 조회해 지속 작업 공간에 전달한다", async () => {
    render(
      await ResourceLayout({
        children: <h1>자료 문서</h1>,
      })
    )

    expect(getSessionMock).toHaveBeenCalledTimes(1)
    expect(getResourceTreeMock).toHaveBeenCalledWith({
      parentId: null,
      scope: "active",
    })
    expect(
      screen.getByRole("region", { name: "자료실 작업 공간" })
    ).toHaveAttribute("data-admin-id", "admin-1")
    expect(
      screen.getByRole("region", { name: "자료실 작업 공간" })
    ).toHaveAttribute("data-tree-status", "ok")
  })

  it("최상위 트리 조회 실패를 직렬화된 오류 상태로 전달한다", async () => {
    getResourceTreeMock.mockResolvedValueOnce({
      error: { code: "network-error", message: "네트워크 오류" },
      status: "error",
    })

    render(await ResourceLayout({ children: <h1>자료실</h1> }))

    expect(
      screen.getByRole("region", { name: "자료실 작업 공간" })
    ).toHaveAttribute("data-tree-status", "error")
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it("세션 network 오류는 로그인으로 보내지 않고 자료실 재시도를 제공한다", async () => {
    getSessionMock.mockResolvedValueOnce({
      error: { code: "network-error", message: "네트워크 오류" },
      status: "error",
    })

    render(await ResourceLayout({ children: <h1>자료실</h1> }))

    expect(redirectMock).not.toHaveBeenCalled()
    expect(
      screen.getByRole("heading", {
        name: "관리자 서비스를 불러올 수 없습니다.",
      })
    ).toBeVisible()
    expect(screen.getByRole("link", { name: "다시 시도" })).toHaveAttribute(
      "href",
      "/resources"
    )
  })
})
