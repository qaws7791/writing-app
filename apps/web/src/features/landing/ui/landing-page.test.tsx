import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LandingPage } from "@/features/landing/ui/landing-page"

describe("공개 랜딩 페이지", () => {
  it("방문자가 로그인, 학습 시작, 코스 탐색 경로를 찾을 수 있다", () => {
    render(<LandingPage />)

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()

    const primaryNavigation = screen.getByRole("navigation", {
      name: /주요 메뉴/u,
    })

    expect(
      within(primaryNavigation).getByRole("link", { name: "로그인" })
    ).toHaveAttribute("href", "/login")
    expect(
      screen.getByRole("link", { name: "글쓰기 시작하기" })
    ).toHaveAttribute("href", "/app")
    expect(screen.getByRole("link", { name: "코스 둘러보기" })).toHaveAttribute(
      "href",
      "/app/courses"
    )
  })

  it("footer는 확인된 제품 route만 제공한다", () => {
    render(<LandingPage />)

    const footer = screen.getByRole("contentinfo")
    const links = within(footer).getAllByRole("link")

    expect(new Set(links.map((link) => link.getAttribute("href")))).toEqual(
      new Set(["/app/courses", "/app", "/login"])
    )
  })
})
