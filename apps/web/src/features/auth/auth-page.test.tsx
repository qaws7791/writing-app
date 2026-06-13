import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AuthPage } from "@/features/auth/auth-page"
import { resolveSafeNextPath } from "@/lib/auth/auth-navigation"

describe("로그인 페이지", () => {
  const locationAssign = vi.fn()

  beforeEach(() => {
    locationAssign.mockClear()
    vi.stubGlobal("location", {
      assign: locationAssign,
    } satisfies Partial<Location>)
  })

  it("Kwep 로그인 화면과 같은 문구, 구조, Google 버튼을 렌더링한다", async () => {
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

    expect(googleLogin).not.toHaveAttribute("type")
    expect(googleLogin).toHaveClass(
      "w-full bg-ink text-white font-bold py-5 rounded-4xl btn-squish flex items-center justify-center gap-3"
    )

    await user.click(googleLogin)
    expect(locationAssign).toHaveBeenCalledWith(
      "/api/auth/sign-in/google?callbackURL=%2Fapp%2Fcourses"
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
