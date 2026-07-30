// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminAuthPage } from "@/features/authentication/ui/admin-auth-page"
import { requestAdminPasswordLogin } from "@/features/authentication/api/admin-auth-client"
import { readLearnerWebOrigin } from "@/shared/config/admin-runtime-config"

const replace = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}))
vi.mock("@/features/authentication/api/admin-auth-client", () => ({
  requestAdminPasswordLogin: vi.fn(),
}))

const requestAdminPasswordLoginMock = vi.mocked(requestAdminPasswordLogin)
const authPageProps = {
  learnerWebOrigin: readLearnerWebOrigin({}),
} as const

describe("AdminAuthPage", () => {
  it("로그인 성공 후 client가 되돌린 안전한 경로로 이동한다", async () => {
    const user = userEvent.setup()
    requestAdminPasswordLoginMock.mockResolvedValue({ nextPath: "/" })
    render(<AdminAuthPage {...authPageProps} nextPath="https://evil.example" />)

    await user.type(screen.getByLabelText("이메일"), "admin@example.com")
    await user.type(screen.getByLabelText("비밀번호"), "admin-password-123")
    await user.click(screen.getByRole("button", { name: "로그인" }))

    await waitFor(() =>
      expect(requestAdminPasswordLoginMock).toHaveBeenCalledWith({
        email: "admin@example.com",
        nextPath: "https://evil.example",
        password: "admin-password-123",
      })
    )
    expect(replace).toHaveBeenCalledWith("/")
  })

  it("로그인 실패를 한국어 오류로 표시한다", async () => {
    const user = userEvent.setup()
    requestAdminPasswordLoginMock.mockRejectedValue(new Error("failed"))
    render(<AdminAuthPage {...authPageProps} nextPath="/" />)

    await user.type(screen.getByLabelText("이메일"), "admin@example.com")
    await user.type(screen.getByLabelText("비밀번호"), "wrong-password")
    await user.click(screen.getByRole("button", { name: "로그인" }))

    expect(
      await screen.findByText("이메일 또는 비밀번호를 확인하세요.")
    ).toBeVisible()
  })
})
