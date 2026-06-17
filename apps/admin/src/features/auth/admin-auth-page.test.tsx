import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AdminAuthPage } from "@/features/auth/admin-auth-page"
import { requestAdminPasswordLogin } from "@/lib/auth/admin-auth-client"

const replace = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
  }),
}))

vi.mock("@/lib/auth/admin-auth-client", () => ({
  requestAdminPasswordLogin: vi.fn(),
}))

const requestAdminPasswordLoginMock = vi.mocked(requestAdminPasswordLogin)

describe("AdminAuthPage", () => {
  beforeEach(() => {
    replace.mockClear()
    requestAdminPasswordLoginMock.mockReset()
  })

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

  it("로그인 성공 후 Next router로 안전한 다음 경로를 replace 한다", async () => {
    const user = userEvent.setup()

    requestAdminPasswordLoginMock.mockResolvedValue("/courses")

    render(<AdminAuthPage nextPath="/courses" />)

    await user.type(screen.getByLabelText("이메일"), "admin@example.com")
    await user.type(screen.getByLabelText("비밀번호"), "admin-password-123")
    await user.click(screen.getByRole("button", { name: "로그인" }))

    await waitFor(() =>
      expect(requestAdminPasswordLoginMock).toHaveBeenCalledWith({
        email: "admin@example.com",
        nextPath: "/courses",
        password: "admin-password-123",
      })
    )
    expect(replace).toHaveBeenCalledWith("/courses")
  })
})
