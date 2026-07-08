import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuthPage } from "@/features/auth/auth-page"
import { resolveSafeNextPath } from "@/lib/auth/auth-navigation"

const authClientMocks = vi.hoisted(() => ({
  requestGoogleLogin: vi.fn(),
  requestTestLogin: vi.fn(),
}))

vi.mock("@/lib/auth/auth-client", () => ({
  requestGoogleLogin: authClientMocks.requestGoogleLogin,
  requestTestLogin: authClientMocks.requestTestLogin,
}))

describe("로그인 페이지", () => {
  beforeEach(() => {
    authClientMocks.requestGoogleLogin.mockClear()
    authClientMocks.requestTestLogin.mockClear()
  })

  it("현재 제품 로그인 화면과 같은 문구, 구조, Google 버튼을 렌더링한다", async () => {
    const user = userEvent.setup()
    render(<AuthPage nextPath="/app/courses" />)

    expect(screen.getByRole("heading", { name: "글결." })).toBeInTheDocument()
    expect(screen.getByText("✍️")).toBeInTheDocument()
    expect(
      screen.getByText("매일 한 단락씩, 글의 결을 다듬는 한국어 글쓰기 학습")
    ).toBeInTheDocument()
    expect(
      screen.getByText("이메일/비밀번호 가입은 지원하지 않습니다")
    ).toBeInTheDocument()

    const googleLogin = screen.getByRole("button", {
      name: "Google로 계속하기",
    })

    expect(googleLogin).toHaveAttribute("type", "button")
    expect(googleLogin.className).toMatch(/bg-ink/)
    expect(googleLogin.className).toMatch(/text-white/)
    expect(
      screen.queryByRole("button", {
        name: "테스트 계정으로 계속하기",
      })
    ).not.toBeInTheDocument()

    await user.click(googleLogin)
    expect(authClientMocks.requestGoogleLogin).toHaveBeenCalledWith(
      "/app/courses"
    )
  })

  it("로컬 테스트 인증이 켜진 경우 테스트 계정 로그인 버튼을 제공한다", async () => {
    const user = userEvent.setup()
    render(<AuthPage nextPath="/app/courses" testAuthEnabled />)

    await user.click(
      screen.getByRole("button", {
        name: "테스트 계정으로 계속하기",
      })
    )

    expect(authClientMocks.requestTestLogin).toHaveBeenCalledWith(
      "/app/courses"
    )
  })

  it("외부 URL과 로그인 재귀 경로를 기본 앱 경로로 바꾼다", () => {
    expect(resolveSafeNextPath("https://example.com/app")).toBe("/app")
    expect(resolveSafeNextPath("//example.com/app")).toBe("/app")
    expect(resolveSafeNextPath("/login?next=/app")).toBe("/app")
    expect(resolveSafeNextPath(["/app/profile"])).toBe("/app/profile")
    expect(resolveSafeNextPath(undefined)).toBe("/app")
  })
})
