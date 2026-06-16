import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AdminAuthPage } from "@/features/auth/admin-auth-page"

describe("AdminAuthPage", () => {
  it("관리자 email/password 로그인 폼과 운영 콘솔 설명을 보여준다", () => {
    render(<AdminAuthPage nextPath="/courses" />)

    expect(screen.getByRole("heading", { name: "관리자 로그인" })).toBeVisible()
    expect(screen.getByText("글결 운영 콘솔")).toBeVisible()
    expect(screen.getByLabelText("이메일")).toBeVisible()
    expect(screen.getByLabelText("비밀번호")).toHaveAttribute(
      "type",
      "password"
    )
    expect(screen.getByRole("button", { name: "로그인" })).toBeVisible()
    expect(screen.queryByText("Google로 계속하기")).not.toBeInTheDocument()
  })
})
