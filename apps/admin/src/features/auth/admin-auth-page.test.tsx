import * as React from "react"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AdminAuthPage } from "@/features/auth/admin-auth-page"
import type { AdminAuthFetch } from "@/lib/auth/admin-auth-client"

const replace = vi.fn()
const refresh = vi.fn()

type DivProps = React.ComponentProps<"div">
type FormLabelProps = React.ComponentProps<"label">
type InputProps = React.ComponentProps<"input">
type ButtonProps = React.ComponentProps<"button">

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
    replace,
  }),
}))

vi.mock("@workspace/ui/components/ui/button", async () => {
  const ReactModule = await import("react")

  return {
    Button: ({ children, ...props }: ButtonProps) =>
      ReactModule.createElement("button", props, children),
  }
})

vi.mock("@workspace/ui/components/ui/card", async () => {
  const ReactModule = await import("react")
  const DivComponent = ({ children, ...props }: DivProps) =>
    ReactModule.createElement("div", props, children)

  return {
    Card: DivComponent,
    CardContent: DivComponent,
    CardDescription: DivComponent,
    CardHeader: DivComponent,
    CardTitle: DivComponent,
  }
})

vi.mock("@workspace/ui/components/ui/field", async () => {
  const ReactModule = await import("react")
  const DivComponent = ({ children, ...props }: DivProps) =>
    ReactModule.createElement("div", props, children)

  return {
    Field: DivComponent,
    FieldError: ({ children, ...props }: DivProps) =>
      ReactModule.createElement("div", { role: "alert", ...props }, children),
    FieldGroup: DivComponent,
    FieldLabel: ({ children, ...props }: FormLabelProps) =>
      ReactModule.createElement("label", props, children),
  }
})

vi.mock("@workspace/ui/components/ui/input", async () => {
  const ReactModule = await import("react")

  return {
    Input: (props: InputProps) => ReactModule.createElement("input", props),
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  replace.mockReset()
  refresh.mockReset()
})

describe("AdminAuthPage", () => {
  it("posts credentials and redirects to the safe next path on success", async () => {
    const fetch = vi.fn<AdminAuthFetch>(async () =>
      Response.json({ user: { id: "admin-1" } })
    )
    vi.stubGlobal("fetch", fetch)

    render(<AdminAuthPage nextPath="/users?status=active" />)

    await userEvent.type(screen.getByLabelText("이메일"), "admin@example.com")
    await userEvent.type(screen.getByLabelText("비밀번호"), "password-1234")
    await userEvent.click(screen.getByRole("button", { name: "로그인" }))

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/users?status=active")
    )
    expect(refresh).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/sign-in/email",
      expect.objectContaining({
        credentials: "include",
        method: "POST",
      })
    )
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      email: "admin@example.com",
      password: "password-1234",
    })
  })

  it("shows an error message when login fails", async () => {
    const fetch = vi.fn<AdminAuthFetch>(async () =>
      Response.json(
        { message: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      )
    )
    vi.stubGlobal("fetch", fetch)

    render(<AdminAuthPage nextPath="/users" />)

    await userEvent.type(screen.getByLabelText("이메일"), "admin@example.com")
    await userEvent.type(screen.getByLabelText("비밀번호"), "wrong-password")
    await userEvent.click(screen.getByRole("button", { name: "로그인" }))

    expect(
      await screen.findByText("이메일 또는 비밀번호가 올바르지 않습니다.")
    ).toBeTruthy()
    expect(replace).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })

  it("prevents duplicate login requests while a request is pending", async () => {
    let resolveResponse: (response: Response) => void = () => undefined
    const fetch = vi.fn<AdminAuthFetch>(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve
        })
    )
    vi.stubGlobal("fetch", fetch)

    const user = userEvent.setup()
    render(<AdminAuthPage nextPath="/users" />)

    await user.type(screen.getByLabelText("이메일"), "admin@example.com")
    await user.type(screen.getByLabelText("비밀번호"), "password-1234")
    const form = screen.getByRole("button", { name: "로그인" }).closest("form")

    form?.requestSubmit()
    form?.requestSubmit()

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    resolveResponse(Response.json({ user: { id: "admin-1" } }))
  })
})
