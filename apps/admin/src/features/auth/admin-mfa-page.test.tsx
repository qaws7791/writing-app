import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AdminMfaPage } from "@/features/auth/admin-mfa-page"
import {
  requestAdminMfaEnrollment,
  requestAdminPasswordChange,
  requestAdminRecoveryCodes,
  requestAdminTotpVerification,
} from "@/lib/auth/admin-auth-client"

const replace = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }))
vi.mock("@/lib/auth/admin-auth-client", () => ({
  requestAdminMfaEnrollment: vi.fn(),
  requestAdminPasswordChange: vi.fn(),
  requestAdminRecoveryCodes: vi.fn(),
  requestAdminTotpVerification: vi.fn(),
}))

describe("AdminMfaPage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("비밀번호 확인, TOTP 검증 뒤 해시 저장용 일회성 복구 코드를 보여준다", async () => {
    const user = userEvent.setup()
    vi.mocked(requestAdminMfaEnrollment).mockResolvedValue({
      totpURI: "otpauth://totp/test?secret=ABCDEFGHIJKLMNOP&issuer=writing-app",
    })
    vi.mocked(requestAdminTotpVerification).mockResolvedValue()
    vi.mocked(requestAdminRecoveryCodes).mockResolvedValue({
      recoveryCodes: Array.from(
        { length: 10 },
        (_, index) => `RECOVERY-${index}`
      ),
    })

    render(<AdminMfaPage enrollmentRequired nextPath="/courses?page=2" />)
    await user.type(screen.getByLabelText("현재 비밀번호"), "password")
    await user.click(screen.getByRole("button", { name: "인증 앱 등록 시작" }))
    expect(await screen.findByText("ABCDEFGHIJKLMNOP")).toBeVisible()

    await user.type(screen.getByLabelText("인증 코드"), "123456")
    await user.click(screen.getByRole("button", { name: "MFA 등록 완료" }))

    expect(await screen.findByText("RECOVERY-0")).toBeVisible()
    expect(screen.getByText(/서버에는 해시만 저장됩니다/)).toBeVisible()
    await user.click(screen.getByRole("button", { name: "저장을 완료했어요" }))
    expect(replace).toHaveBeenCalledWith("/courses?page=2")
  })

  it("비밀번호 변경 요청은 다른 세션 폐기 계약을 사용한다", async () => {
    const user = userEvent.setup()
    vi.mocked(requestAdminPasswordChange).mockResolvedValue()
    render(<AdminMfaPage enrollmentRequired={false} nextPath="/users" />)

    await user.type(screen.getByLabelText("현재 비밀번호"), "old-password")
    await user.type(screen.getByLabelText("새 비밀번호"), "new-password")
    await user.click(screen.getByRole("button", { name: "비밀번호 변경" }))

    await waitFor(() =>
      expect(requestAdminPasswordChange).toHaveBeenCalledWith({
        currentPassword: "old-password",
        newPassword: "new-password",
      })
    )
    expect(replace).toHaveBeenCalledWith("/login?next=%2Fusers")
  })
})
