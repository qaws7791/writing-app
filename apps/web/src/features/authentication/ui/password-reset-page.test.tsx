import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LearnerAuthClientError } from "@workspace/auth/learner/client"

import { PasswordResetPage } from "@/features/authentication/ui/password-reset-page"

const authClientMocks = vi.hoisted(() => ({
  resetPassword: vi.fn(async () => undefined),
}))

vi.mock("@/features/authentication/api/auth-client", () => ({
  resetPassword: authClientMocks.resetPassword,
}))

describe("비밀번호 재설정 페이지", () => {
  beforeEach(() => {
    authClientMocks.resetPassword.mockClear()
  })

  it("일치하는 새 비밀번호를 제출하고 기존 session 폐기를 안내한다", async () => {
    const user = userEvent.setup()
    render(<PasswordResetPage token="reset-token" />)

    await user.type(
      screen.getByLabelText("새 비밀번호"),
      "New-learner-password-123!"
    )
    await user.type(
      screen.getByLabelText("새 비밀번호 확인"),
      "New-learner-password-123!"
    )
    await user.click(screen.getByRole("button", { name: "비밀번호 변경하기" }))

    expect(authClientMocks.resetPassword).toHaveBeenCalledWith({
      newPassword: "New-learner-password-123!",
      token: "reset-token",
    })
    expect(
      await screen.findByText(
        "비밀번호를 변경했습니다. 모든 기존 로그인은 종료되었습니다."
      )
    ).toBeInTheDocument()
  })

  it("사용할 수 없는 token과 provider 원문을 동일한 안내로 표시한다", async () => {
    const { unmount } = render(<PasswordResetPage token={undefined} />)

    expect(
      screen.getByText("재설정 링크가 만료되었거나 이미 사용되었습니다.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "비밀번호 변경하기" })
    ).toBeDisabled()

    unmount()
    authClientMocks.resetPassword.mockRejectedValueOnce(
      new LearnerAuthClientError("invalid-reset-token")
    )
    const user = userEvent.setup()
    render(<PasswordResetPage token="used-token" />)
    await user.type(
      screen.getByLabelText("새 비밀번호"),
      "New-learner-password-123!"
    )
    await user.type(
      screen.getByLabelText("새 비밀번호 확인"),
      "New-learner-password-123!"
    )
    await user.click(screen.getByRole("button", { name: "비밀번호 변경하기" }))

    expect(
      await screen.findByText("재설정 링크가 만료되었거나 이미 사용되었습니다.")
    ).toBeInTheDocument()
  })
})
