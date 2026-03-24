import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import SignUpView from "@/views/sign-up-view"

const { signUpEmail } = vi.hoisted(() => ({
  signUpEmail: vi.fn(),
}))

vi.mock("@/features/auth/repositories/auth-client", () => ({
  authClient: {
    signUp: {
      email: signUpEmail,
    },
  },
}))

describe("sign-up view", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("shows verification guidance after successful sign up", async () => {
    const user = userEvent.setup()
    signUpEmail.mockResolvedValue({
      data: {
        user: {
          email: "new-user@example.com",
        },
      },
      error: null,
    })

    render(<SignUpView />)

    await user.type(screen.getByLabelText("이름"), "새 사용자")
    await user.type(screen.getByLabelText("이메일"), "new-user@example.com")
    await user.type(screen.getByLabelText("비밀번호"), "password1234")
    await user.click(screen.getByRole("button", { name: "인증 메일 보내기" }))

    await waitFor(() => {
      expect(signUpEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "new-user@example.com",
          name: "새 사용자",
          password: "password1234",
        })
      )
    })
    expect(
      await screen.findByText("인증 메일을 보냈습니다.")
    ).toBeInTheDocument()
    expect(screen.getByText("new-user@example.com")).toBeInTheDocument()
  })

  test("shows duplicate email guidance when sign-up conflicts", async () => {
    const user = userEvent.setup()
    signUpEmail.mockResolvedValue({
      data: null,
      error: {
        message: "ignored",
        status: 409,
      },
    })

    render(<SignUpView />)

    await user.type(screen.getByLabelText("이름"), "기존 사용자")
    await user.type(screen.getByLabelText("이메일"), "existing@example.com")
    await user.type(screen.getByLabelText("비밀번호"), "password1234")
    await user.click(screen.getByRole("button", { name: "인증 메일 보내기" }))

    expect(
      await screen.findByText(
        "이미 가입된 이메일입니다. 로그인하거나 비밀번호 재설정을 사용해 주세요."
      )
    ).toBeInTheDocument()
  })
})
