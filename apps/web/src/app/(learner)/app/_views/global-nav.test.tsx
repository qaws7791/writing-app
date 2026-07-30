import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GlobalNav } from "@/app/(learner)/app/_views/global-nav"
import { MobileNav } from "@/app/(learner)/app/_views/mobile-nav"

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/profile",
}))

describe("전역 내비게이션", () => {
  it("header 브랜드와 주요 링크의 목적지를 링크 의미론으로 제공한다", () => {
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
  })

  it("이모지 계정 메뉴 트리거는 이모지 대신 접근 가능한 이름을 노출한다", () => {
    render(<GlobalNav currentPath="/app/profile" />)

    expect(screen.getByRole("button", { name: "계정 메뉴" })).toHaveTextContent(
      "✍️"
    )
    expect(screen.queryByRole("button", { name: "✍️" })).not.toBeInTheDocument()
  })

  it("계정 메뉴 트리거를 누르면 메뉴를 열고 계정 항목을 노출한다", async () => {
    const user = userEvent.setup()
    render(<GlobalNav currentPath="/app/profile" />)

    const accountMenuTrigger = screen.getByRole("button", {
      name: "계정 메뉴",
    })
    expect(accountMenuTrigger).toHaveAttribute("aria-expanded", "false")

    await user.click(accountMenuTrigger)

    expect(
      await screen.findByRole("menu", { name: "계정 메뉴" })
    ).toBeInTheDocument()
    expect(accountMenuTrigger).toHaveAttribute("aria-expanded", "true")
    expect(
      await screen.findByRole("menuitem", { name: "프로필" })
    ).toHaveAttribute("href", "/app/profile")
    expect(screen.getByRole("menuitem", { name: "로그아웃" })).toHaveAttribute(
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
