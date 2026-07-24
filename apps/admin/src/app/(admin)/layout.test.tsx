import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

import AdminLayout from "@/app/(admin)/layout"

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
}))
const { getAdminSessionMock, getServerAdminRequestOptionsMock, headersMock } =
  vi.hoisted(() => ({
    getAdminSessionMock: vi.fn(),
    getServerAdminRequestOptionsMock: vi.fn(),
    headersMock: vi.fn(),
  }))

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}))
vi.mock("next/headers", () => ({
  headers: headersMock,
}))

vi.mock("@/app/(admin)/_views/admin-shell", () => ({
  AdminShell({ children }: { readonly children: ReactNode }) {
    return <section aria-label="관리자 콘솔">{children}</section>
  },
}))

vi.mock("@workspace/http-client/admin", () => ({
  getAdminSession: getAdminSessionMock,
}))

vi.mock("@/server/http/admin-api-request-options", () => ({
  getServerAdminRequestOptions: getServerAdminRequestOptionsMock,
}))

describe("어드민 layout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    headersMock.mockResolvedValue(new Headers())
    getServerAdminRequestOptionsMock.mockResolvedValue({})
    getAdminSessionMock.mockResolvedValue({
      admin: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
      },
    })
  })

  it("관리자 세션 토큰이 없으면 로그인 화면으로 보낸다", async () => {
    getServerAdminRequestOptionsMock.mockResolvedValueOnce(null)

    await expect(
      AdminLayout({
        children: <h1>대시보드</h1>,
      })
    ).rejects.toBeInstanceOf(Error)

    expect(redirectMock).toHaveBeenCalledWith("/login?next=%2F")
    expect(getAdminSessionMock).not.toHaveBeenCalled()
  })

  it("관리자 세션 토큰이 있으면 콘솔 shell을 렌더링한다", async () => {
    render(
      await AdminLayout({
        children: <h1>대시보드</h1>,
      })
    )

    expect(redirectMock).not.toHaveBeenCalled()
    expect(screen.getByRole("region", { name: "관리자 콘솔" })).toBeVisible()
    expect(screen.getByRole("heading", { name: "대시보드" })).toBeVisible()
  })

  it("쿠키가 있어도 서버 세션이 유효하지 않으면 로그인 화면으로 보낸다", async () => {
    getAdminSessionMock.mockRejectedValueOnce(
      new GeneratedApiClientError({
        error: {
          code: "UNAUTHORIZED",
          message: "인증이 필요합니다.",
          requestId: "session-request",
        },
        kind: "http",
        retryAfterSeconds: null,
        status: 401,
      })
    )

    await expect(
      AdminLayout({ children: <h1>대시보드</h1> })
    ).rejects.toBeInstanceOf(Error)

    expect(redirectMock).toHaveBeenCalledWith("/login?next=%2F")
  })

  it.each([
    new GeneratedApiClientError({
      kind: "contract",
      reason: "invalid-json-response",
      status: 200,
    }),
    new GeneratedApiClientError({
      kind: "network",
      method: "GET",
      url: "https://api.example.test/api/admin/session",
    }),
  ])(
    "$name 세션 오류는 로그인으로 보내지 않고 서비스 오류를 보여준다",
    async (error) => {
      getAdminSessionMock.mockRejectedValueOnce(error)

      render(await AdminLayout({ children: <h1>대시보드</h1> }))

      expect(redirectMock).not.toHaveBeenCalled()
      expect(
        screen.getByRole("heading", {
          name: "관리자 서비스를 불러올 수 없습니다.",
        })
      ).toBeVisible()
      expect(screen.getByRole("link", { name: "다시 시도" })).toHaveAttribute(
        "href",
        "/"
      )
    }
  )
})
