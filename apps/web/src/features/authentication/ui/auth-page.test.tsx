import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LearnerAuthClientError } from "@workspace/auth/learner/client"

import { AuthPage } from "@/features/authentication/ui/auth-page"

const authClientMocks = vi.hoisted(() => ({
  requestEmailLogin: vi.fn(async () => undefined),
  requestEmailSignUp: vi.fn(async () => undefined),
  requestGoogleLogin: vi.fn(async () => undefined),
  requestPasswordReset: vi.fn(async () => undefined),
  requestVerificationEmail: vi.fn(async () => undefined),
}))

vi.mock("@/features/authentication/api/auth-client", () => ({
  requestEmailLogin: authClientMocks.requestEmailLogin,
  requestEmailSignUp: authClientMocks.requestEmailSignUp,
  requestGoogleLogin: authClientMocks.requestGoogleLogin,
  requestPasswordReset: authClientMocks.requestPasswordReset,
  requestVerificationEmail: authClientMocks.requestVerificationEmail,
}))

describe("로그인 및 가입 페이지", () => {
  beforeEach(() => {
    authClientMocks.requestEmailLogin.mockClear()
    authClientMocks.requestEmailSignUp.mockClear()
    authClientMocks.requestGoogleLogin.mockClear()
    authClientMocks.requestPasswordReset.mockClear()
    authClientMocks.requestVerificationEmail.mockClear()
  })

  it("이메일과 비밀번호 제출을 next 경로와 함께 이메일 로그인 요청으로 보낸다", async () => {
    const user = userEvent.setup()
    render(<AuthPage nextPath="/app/courses" />)

    changeInput("이메일", "learner@example.com")
    changeInput("비밀번호", "password")
    await user.click(
      screen.getByRole("button", { name: "이메일로 로그인하기" })
    )

    expect(authClientMocks.requestEmailLogin).toHaveBeenCalledWith({
      email: "learner@example.com",
      nextPath: "/app/courses",
      password: "password",
    })
  })

  it("가입 후 계정 존재를 노출하지 않는 확인 안내와 재전송을 제공한다", async () => {
    const user = userEvent.setup()
    render(<AuthPage nextPath="/app/courses" />)

    await user.click(screen.getByRole("tab", { name: "가입" }))
    changeInput("이름", "학습자")
    changeInput("이메일", "learner@example.com")
    changeInput("비밀번호", "Learner-password-123!")
    await user.click(screen.getByRole("button", { name: "이메일로 가입하기" }))

    expect(authClientMocks.requestEmailSignUp).toHaveBeenCalledWith({
      email: "learner@example.com",
      name: "학습자",
      nextPath: "/app/courses",
      password: "Learner-password-123!",
    })
    expect(
      await screen.findByText(
        "입력한 주소로 확인 메일을 보냈습니다. 이미 가입한 주소라면 로그인해 주세요."
      )
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "확인 메일 다시 보내기" })
    )
    expect(authClientMocks.requestVerificationEmail).toHaveBeenCalledWith({
      email: "learner@example.com",
      nextPath: "/app/courses",
    })
    expect(
      await screen.findByText(
        "확인 메일을 다시 보냈습니다. 받은편지함과 스팸함을 확인해 주세요."
      )
    ).toBeInTheDocument()
  })

  it("약한 비밀번호를 한국어 오류로 표시하고 가입 요청을 보내지 않는다", async () => {
    const user = userEvent.setup()
    render(<AuthPage nextPath="/app" />)

    await user.click(screen.getByRole("tab", { name: "가입" }))
    changeInput("이름", "학습자")
    changeInput("이메일", "learner@example.com")
    changeInput("비밀번호", "short")
    await user.click(screen.getByRole("button", { name: "이메일로 가입하기" }))

    expect(
      screen.getByText("비밀번호는 12자 이상으로 입력해 주세요.")
    ).toBeInTheDocument()
    expect(authClientMocks.requestEmailSignUp).not.toHaveBeenCalled()
  })

  it("명시적 중복 이메일 오류는 로그인 안내로 정규화한다", async () => {
    authClientMocks.requestEmailSignUp.mockRejectedValueOnce(
      new LearnerAuthClientError("duplicate-email")
    )
    const user = userEvent.setup()
    render(<AuthPage nextPath="/app" />)

    await user.click(screen.getByRole("tab", { name: "가입" }))
    changeInput("이름", "학습자")
    changeInput("이메일", "learner@example.com")
    changeInput("비밀번호", "Learner-password-123!")
    await user.click(screen.getByRole("button", { name: "이메일로 가입하기" }))

    expect(
      await screen.findByText("이미 가입된 이메일입니다. 로그인해 주세요.")
    ).toBeInTheDocument()
  })

  it("확인 전 로그인과 재전송 제한을 한국어 오류로 표시한다", async () => {
    authClientMocks.requestEmailLogin.mockRejectedValueOnce(
      new LearnerAuthClientError("email-not-verified")
    )
    authClientMocks.requestVerificationEmail.mockRejectedValueOnce(
      new LearnerAuthClientError("rate-limited")
    )
    const user = userEvent.setup()
    render(<AuthPage nextPath="/app" />)

    changeInput("이메일", "learner@example.com")
    changeInput("비밀번호", "password")
    await user.click(
      screen.getByRole("button", { name: "이메일로 로그인하기" })
    )
    expect(
      await screen.findByText("이메일 확인을 먼저 완료해 주세요.")
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "확인 메일 다시 보내기" })
    )
    expect(
      await screen.findByText(
        "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
      )
    ).toBeInTheDocument()
  })

  it.each([
    {
      label: "이메일 확인 완료 callback",
      message: "이메일 확인이 완료되었습니다. 이제 로그인해 주세요.",
      props: { verificationStatus: "verified" },
    },
    {
      label: "만료된 이메일 확인 링크",
      message:
        "확인 링크가 만료되었거나 올바르지 않습니다. 다시 요청해 주세요.",
      props: { verificationStatus: "failed" },
    },
    {
      label: "Google 연결 실패",
      message:
        "Google 계정을 연결하지 못했습니다. 잠시 후 다시 시도하거나 이메일로 로그인해 주세요.",
      props: { authenticationStatus: "provider-failed" },
    },
  ] as const)(
    "$label을 일반화한 안내 문구로 표시한다",
    ({ message, props }) => {
      render(<AuthPage nextPath="/app/courses" {...props} />)

      expect(screen.getByText(message)).toBeInTheDocument()
    }
  )

  it("비밀번호 재설정 요청은 계정 존재 여부와 무관한 안내를 표시한다", async () => {
    const user = userEvent.setup()
    render(<AuthPage nextPath="/app" />)

    await user.click(
      screen.getByRole("button", { name: "비밀번호를 잊으셨나요?" })
    )
    changeInput("이메일", "learner@example.com")
    await user.click(screen.getByRole("button", { name: "재설정 링크 받기" }))

    expect(authClientMocks.requestPasswordReset).toHaveBeenCalledWith(
      "learner@example.com"
    )
    expect(
      await screen.findByText(
        "가입된 주소라면 비밀번호 재설정 메일을 보냈습니다. 받은편지함을 확인해 주세요."
      )
    ).toBeInTheDocument()
  })
})

function changeInput(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}
