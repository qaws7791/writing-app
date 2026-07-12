import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import AdminLayout from "@/app/(admin)/layout"

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`)
  }),
}))
const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}))

vi.mock("@/components/admin-shell", () => ({
  AdminShell({ children }: { readonly children: ReactNode }) {
    return <section aria-label="관리자 콘솔">{children}</section>
  },
}))

vi.mock("@/lib/auth/server-admin-session-token", () => ({
  getServerAdminSessionToken: vi.fn(async () => "admin-token"),
}))

vi.mock("@/lib/api/get-server-admin-api", () => ({
  getServerAdminApi: vi.fn(() => ({
    getSession: getSessionMock,
  })),
}))

describe("어드민 layout", () => {
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
        mfa: {
          enrollmentRequired: false,
          stepUpRequired: false,
        },
      },
    })
  })

  it.each([
    [true, false, "/mfa"],
    [false, true, "/login?next=%2F"],
  ] as const)(
    "MFA 등록=%s step-up=%s 상태는 %s로 보낸다",
    async (enrollmentRequired, stepUpRequired, path) => {
      getSessionMock.mockResolvedValueOnce({
        status: "ok",
        value: {
          admin: {
            email: "admin@example.com",
            id: "admin-1",
            name: "관리자",
            role: "owner",
          },
          mfa: { enrollmentRequired, stepUpRequired },
        },
      })

      await expect(
        AdminLayout({ children: <h1>대시보드</h1> })
      ).rejects.toBeInstanceOf(Error)
      expect(redirectMock).toHaveBeenCalledWith(path)
    }
  )

  it("관리자 세션 토큰이 없으면 로그인 화면으로 보낸다", async () => {
    const { getServerAdminSessionToken } =
      await import("@/lib/auth/server-admin-session-token")
    vi.mocked(getServerAdminSessionToken).mockResolvedValueOnce(null)

    await expect(
      AdminLayout({
        children: <h1>대시보드</h1>,
      })
    ).rejects.toBeInstanceOf(Error)

    expect(redirectMock).toHaveBeenCalledWith("/login?next=%2F")
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
    getSessionMock.mockResolvedValueOnce({
      error: { code: "unauthorized", message: "인증이 필요합니다." },
      status: "error",
    })

    await expect(
      AdminLayout({ children: <h1>대시보드</h1> })
    ).rejects.toBeInstanceOf(Error)

    expect(redirectMock).toHaveBeenCalledWith("/login?next=%2F")
  })

  it.each(["contract-error", "network-error"] as const)(
    "%s 세션 오류는 로그인으로 보내지 않고 서비스 오류를 보여준다",
    async (code) => {
      getSessionMock.mockResolvedValueOnce({
        error: { code, message: "서비스 오류" },
        status: "error",
      })

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
