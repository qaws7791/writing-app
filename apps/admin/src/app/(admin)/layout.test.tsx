// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

import AdminLayout from "@/app/(admin)/layout"
import { adminRequestPathHeader } from "@/shared/auth/admin-request-path"

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
    stubRequestPath("/")
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

    await expect(renderLayout()).rejects.toThrow("redirect:/login?next=%2F")

    expect(getAdminSessionMock).not.toHaveBeenCalled()
  })

  it("관리자 세션 토큰이 있으면 콘솔 shell을 렌더링한다", async () => {
    render(await renderLayout())

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

    await expect(renderLayout()).rejects.toThrow("redirect:/login?next=%2F")
  })

  it.each([
    {
      error: new GeneratedApiClientError({
        kind: "contract",
        reason: "invalid-json-response",
        status: 200,
      }),
      kind: "contract",
    },
    {
      error: new GeneratedApiClientError({
        kind: "network",
        method: "GET",
        url: "https://api.example.test/api/admin/session",
      }),
      kind: "network",
    },
  ])(
    "$kind 세션 오류는 로그인으로 보내지 않고 서비스 오류를 보여준다",
    async ({ error }) => {
      getAdminSessionMock.mockRejectedValueOnce(error)

      render(await renderLayout())

      expect(redirectMock).not.toHaveBeenCalled()
      expect(
        screen.getByRole("heading", {
          name: "관리자 서비스를 불러올 수 없습니다.",
        })
      ).toBeVisible()
    }
  )

  it("요청 경로 헤더의 내부 경로는 로그인 next 파라미터로 보존한다", async () => {
    stubRequestPath("/courses")
    getServerAdminRequestOptionsMock.mockResolvedValueOnce(null)

    await expect(renderLayout()).rejects.toThrow(
      "redirect:/login?next=%2Fcourses"
    )
  })

  it.each(["https://evil.example", "//evil.example"])(
    "요청 경로 헤더의 외부 URL %s은 로그인 redirect 대상에서 관리자 홈으로 내려앉는다",
    async (requestPath) => {
      stubRequestPath(requestPath)
      getServerAdminRequestOptionsMock.mockResolvedValueOnce(null)

      await expect(renderLayout()).rejects.toThrow("redirect:/login?next=%2F")
    }
  )

  it("요청 경로 헤더의 외부 URL은 서비스 오류 화면의 재시도 링크에서도 관리자 홈으로 내려앉는다", async () => {
    stubRequestPath("https://evil.example")
    getAdminSessionMock.mockRejectedValueOnce(
      new GeneratedApiClientError({
        kind: "network",
        method: "GET",
        url: "https://api.example.test/api/admin/session",
      })
    )

    render(await renderLayout())

    expect(screen.getByRole("link", { name: "다시 시도" })).toHaveAttribute(
      "href",
      "/"
    )
  })
})

function stubRequestPath(requestPath: string): void {
  headersMock.mockResolvedValue(
    new Headers({ [adminRequestPathHeader]: requestPath })
  )
}

function renderLayout() {
  return AdminLayout({ children: <h1>대시보드</h1> })
}
