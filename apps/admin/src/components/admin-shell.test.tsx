import React from "react"
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AdminShell } from "@/components/admin-shell"

vi.mock("next/navigation", () => ({
  usePathname: () => "/courses",
  useRouter: () => ({
    replace: vi.fn(),
  }),
}))

describe("AdminShell", () => {
  it("어드민 주요 내비게이션과 본문 영역을 렌더링한다", () => {
    render(
      <AdminShell activePath="/courses">
        <main>
          <h1>콘텐츠 관리</h1>
        </main>
      </AdminShell>
    )

    expect(screen.getByText("글결")).toBeInTheDocument()
    expect(screen.getByText("어드민")).toBeInTheDocument()
    const navigation = screen.getByRole("navigation", {
      name: "어드민 주요 메뉴",
    })

    expect(
      within(navigation).getByRole("link", { name: "대시보드" })
    ).toHaveAttribute("href", "/")
    expect(
      within(navigation).getByRole("link", { name: "콘텐츠 관리" })
    ).toHaveAttribute("aria-current", "page")
    expect(
      within(navigation).getByRole("link", { name: "자료실" })
    ).toHaveAttribute("href", "/resources")
    expect(
      within(navigation).getByRole("link", { name: "AI 에이전트" })
    ).toHaveAttribute("href", "/chat")
    expect(
      within(navigation).getByRole("link", { name: "사용자 관리" })
    ).toHaveAttribute("href", "/users")
    expect(
      within(navigation).getByRole("link", { name: "분석" })
    ).toHaveAttribute("href", "/analytics")
    expect(
      within(navigation).getByRole("link", { name: "운영 설정" })
    ).toHaveAttribute("href", "/settings")
    expect(screen.getByRole("link", { name: "앱으로 이동" })).toBeVisible()
    expect(
      screen.getByRole("button", { name: "어드민 로그아웃" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "콘텐츠 관리" })
    ).toBeInTheDocument()
  })
})
