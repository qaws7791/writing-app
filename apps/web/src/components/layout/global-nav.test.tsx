import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GlobalNav, MobileNav } from "@/components/layout/global-nav"

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/profile",
}))

describe("전역 내비게이션", () => {
  it("현재 제품 header의 내부 이동을 링크 의미론으로 제공한다", async () => {
    const user = userEvent.setup()
    render(<GlobalNav currentPath="/app/profile" />)

    expect(screen.getByRole("link", { name: "글결." })).toHaveAttribute(
      "href",
      "/app"
    )

    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute(
      "href",
      "/app"
    )
    expect(screen.getByRole("link", { name: "배우기" })).toHaveAttribute(
      "href",
      "/app/courses"
    )

    await user.click(screen.getByRole("button", { name: "✍️" }))

    expect(screen.getByRole("link", { name: "프로필" })).toHaveAttribute(
      "href",
      "/app/profile"
    )
    expect(screen.getByRole("link", { name: "로그아웃" })).toHaveAttribute(
      "href",
      "/login"
    )
  })

  it("모바일 하단 내비게이션의 현재 페이지를 링크 상태로 표시한다", () => {
    render(<MobileNav currentPath="/app/courses/c1" />)

    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute(
      "href",
      "/app"
    )
    expect(screen.getByRole("link", { name: "배우기" })).toHaveAttribute(
      "href",
      "/app/courses"
    )
    expect(screen.getByRole("link", { name: "배우기" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByRole("link", { name: "프로필" })).toHaveAttribute(
      "href",
      "/app/profile"
    )
  })
})
