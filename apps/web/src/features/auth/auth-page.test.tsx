import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AuthPage } from "@/features/auth/auth-page"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}))

vi.mock("@workspace/ui/components/ui/button", () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const { children, type, ...buttonProps } = props
    void type

    return (
      <button type="button" {...buttonProps}>
        {children}
      </button>
    )
  },
}))

vi.mock("@workspace/ui/components/ui/card", () => ({
  Card: ({ children }: React.PropsWithChildren) => (
    <section>{children}</section>
  ),
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  CardHeader: ({ children }: React.PropsWithChildren) => (
    <header>{children}</header>
  ),
  CardTitle: ({ children }: React.PropsWithChildren) => <h1>{children}</h1>,
}))

vi.mock("@workspace/ui/components/ui/field", () => ({
  Field: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  FieldError: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  FieldGroup: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  FieldLabel: ({
    children,
    htmlFor,
  }: React.PropsWithChildren<{ htmlFor: string }>) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}))

vi.mock("@workspace/ui/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}))

describe("AuthPage", () => {
  it("offers only Google login for learner authentication", () => {
    render(<AuthPage nextPath="/app/courses" />)

    expect(
      screen.getByRole("button", { name: /Google로 계속하기/ })
    ).toBeDefined()
    expect(screen.queryByLabelText("이메일")).toBeNull()
    expect(screen.queryByLabelText("비밀번호")).toBeNull()
    expect(screen.queryByRole("link", { name: "회원가입" })).toBeNull()
  })
})
