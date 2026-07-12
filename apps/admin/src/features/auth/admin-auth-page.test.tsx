import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AdminAuthPage } from "@/features/auth/admin-auth-page"
import {
  requestAdminMfaRecovery,
  requestAdminPasswordLogin,
  requestAdminTotpVerification,
} from "@/lib/auth/admin-auth-client"

const replace = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
  }),
}))

vi.mock("@/lib/auth/admin-auth-client", () => ({
  requestAdminMfaRecovery: vi.fn(),
  requestAdminPasswordLogin: vi.fn(),
  requestAdminTotpVerification: vi.fn(),
}))

const requestAdminPasswordLoginMock = vi.mocked(requestAdminPasswordLogin)
const requestAdminTotpVerificationMock = vi.mocked(requestAdminTotpVerification)
const requestAdminMfaRecoveryMock = vi.mocked(requestAdminMfaRecovery)

describe("AdminAuthPage", () => {
  beforeEach(() => {
    replace.mockClear()
    requestAdminPasswordLoginMock.mockReset()
    requestAdminTotpVerificationMock.mockReset()
    requestAdminMfaRecoveryMock.mockReset()
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
    expect(screen.queryByText("Google로 계속하기")).not.toBeInTheDocument()
  })

  it("로그인 성공 후 Next router로 안전한 다음 경로를 replace 한다", async () => {
    const user = userEvent.setup()

    requestAdminPasswordLoginMock.mockResolvedValue({
      kind: "signed-in",
      nextPath: "/courses",
    })

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

  it("owner 1차 로그인 뒤 TOTP를 검증해야 다음 경로로 이동한다", async () => {
    const user = userEvent.setup()
    requestAdminPasswordLoginMock.mockResolvedValue({
      kind: "mfa-required",
      nextPath: "/courses",
    })
    requestAdminTotpVerificationMock.mockResolvedValue()
    render(<AdminAuthPage nextPath="/courses" />)

    await user.type(screen.getByLabelText("이메일"), "owner@example.com")
    await user.type(screen.getByLabelText("비밀번호"), "password")
    await user.click(screen.getByRole("button", { name: "로그인" }))
    await user.type(await screen.findByLabelText("인증 코드"), "123456")
    await user.click(screen.getByRole("button", { name: "인증하고 계속" }))

    await waitFor(() =>
      expect(requestAdminTotpVerificationMock).toHaveBeenCalledWith("123456")
    )
    expect(replace).toHaveBeenCalledWith("/courses")
  })

  it("인증 앱 분실 시 비밀번호와 일회용 복구 코드로 세션을 폐기한다", async () => {
    const user = userEvent.setup()
    requestAdminPasswordLoginMock.mockResolvedValue({
      kind: "mfa-required",
      nextPath: "/",
    })
    requestAdminMfaRecoveryMock.mockResolvedValue()
    render(<AdminAuthPage nextPath="/" />)

    await user.type(screen.getByLabelText("이메일"), "owner@example.com")
    await user.type(screen.getByLabelText("비밀번호"), "password")
    await user.click(screen.getByRole("button", { name: "로그인" }))
    await user.click(
      await screen.findByRole("button", { name: "인증 앱을 분실했어요" })
    )
    await user.type(screen.getByLabelText("이메일"), "owner@example.com")
    await user.type(screen.getByLabelText("비밀번호"), "password")
    await user.type(screen.getByLabelText("복구 코드"), "RECOVERY-CODE")
    await user.click(screen.getByRole("button", { name: "MFA 복구" }))

    expect(
      await screen.findByText(/기존 세션이 모두 폐기되었습니다/)
    ).toBeVisible()
  })
})
