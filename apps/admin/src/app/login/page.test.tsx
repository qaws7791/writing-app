import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import AdminLoginRoute from "@/app/login/page"

vi.mock("@/features/auth/admin-auth-page", () => ({
  AdminAuthPage({ nextPath }: { readonly nextPath: string }) {
    return <div data-testid="next-path">{nextPath}</div>
  },
}))

describe("어드민 로그인 route", () => {
  it("중복 next query에서는 첫 번째 문자열만 전달한다", async () => {
    render(
      await AdminLoginRoute({
        searchParams: Promise.resolve({
          next: ["/courses", "/users"],
        }),
      })
    )

    expect(screen.getByTestId("next-path")).toHaveTextContent("/courses")
  })
})
