import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminAuthPage } from "@/features/auth/admin-auth-page"

describe("AdminAuthPage", () => {
  it("관리자 로그인 CTA와 운영 콘솔 설명을 보여준다", () => {
    render(
      <AdminAuthPage signInPath="/api/auth/sign-in/google?callbackURL=%2F" />
    )

    expect(screen.getByRole("heading", { name: "관리자 로그인" })).toBeVisible()
    expect(screen.getByText("글결 운영 콘솔")).toBeVisible()
    expect(
      screen.getByRole("link", { name: "Google로 계속하기" })
    ).toHaveAttribute("href", "/api/auth/sign-in/google?callbackURL=%2F")
  })
})
