import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import SignInPageClient from "./sign-in-page-client"

const { push, refresh, signInEmail } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signInEmail: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}))

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: signInEmail,
    },
  },
}))

describe("sign-in page client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("submits credentials and redirects to /home on success", async () => {
    const user = userEvent.setup()
    signInEmail.mockResolvedValue({
      data: {
        user: {
          email: "writer@example.com",
        },
      },
      error: null,
    })

    render(<SignInPageClient verified={false} />)

    await user.type(screen.getByLabelText("이메일"), "writer@example.com")
    await user.type(screen.getByLabelText("비밀번호"), "password1234")
    await user.click(screen.getByRole("button", { name: "로그인" }))

    await waitFor(() => {
      expect(signInEmail).toHaveBeenCalledWith({
        email: "writer@example.com",
        password: "password1234",
      })
    })
    expect(push).toHaveBeenCalledWith("/home")
    expect(refresh).toHaveBeenCalled()
  })
})
