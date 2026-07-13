import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AdminAuthPage } from "@/features/auth/admin-auth-page"
import { requestAdminPasswordLogin } from "@/lib/auth/admin-auth-client"

const replace = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
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

    expect(screen.getByRole("heading", { name: "글결 어드민" })).toBeVisible()
    expect(
      screen.getByText("접근하려면 관리자 계정으로 로그인하세요.")
    ).toBeVisible()
    expect(screen.getByLabelText("이메일")).toBeVisible()
    expect(screen.getByLabelText("비밀번호")).toHaveAttribute(
      "type",
      "password"
    )
    expect(screen.getByRole("button", { name: "로그인" })).toBeVisible()
  })

  it("로그인 성공 후 안전한 다음 경로로 이동한다", async () => {
    const user = userEvent.setup()
    requestAdminPasswordLoginMock.mockResolvedValue({ nextPath: "/courses" })
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

  it("로그인 실패를 한국어 오류로 표시한다", async () => {
    const user = userEvent.setup()
    requestAdminPasswordLoginMock.mockRejectedValue(new Error("failed"))
    render(<AdminAuthPage nextPath="/" />)

    await user.type(screen.getByLabelText("이메일"), "admin@example.com")
    await user.type(screen.getByLabelText("비밀번호"), "wrong-password")
    await user.click(screen.getByRole("button", { name: "로그인" }))

    expect(
      await screen.findByText("이메일 또는 비밀번호를 확인하세요.")
    ).toBeVisible()
  })
})
