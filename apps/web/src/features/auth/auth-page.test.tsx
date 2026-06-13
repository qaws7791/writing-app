import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AuthPage } from "@/features/auth/auth-page"
import { resolveSafeNextPath } from "@/lib/auth/auth-navigation"

describe("로그인 페이지", () => {
  it("Google 로그인 링크에 안전한 다음 경로를 포함한다", () => {
    render(<AuthPage nextPath="/app/courses" />)

    expect(
      screen.getByRole("heading", { name: "글결에 로그인" })
    ).toBeInTheDocument()

    const googleLogin = screen.getByRole("link", {
      name: "Google로 계속하기",
    })
    expect(googleLogin).toHaveAttribute(
      "href",
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
