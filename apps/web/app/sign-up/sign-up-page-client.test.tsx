import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import SignUpPageClient from "./sign-up-page-client"

const { signUpEmail } = vi.hoisted(() => ({
  signUpEmail: vi.fn(),
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: signUpEmail,
    },
  },
}))

describe("sign-up page client", () => {
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

    render(<SignUpPageClient />)

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
})
