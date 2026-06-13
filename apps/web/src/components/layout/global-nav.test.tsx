import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { GlobalNav } from "@/components/layout/global-nav"

describe("전역 내비게이션", () => {
  it("프로필 진입점을 제공하고 현재 경로를 표시한다", () => {
    render(<GlobalNav currentPath="/app/profile" />)

    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute(
      "href",
      "/app"
    )
    expect(screen.getByRole("link", { name: "배우기" })).toHaveAttribute(
      "href",
      "/app/courses"
    )
    expect(screen.getByRole("link", { name: "프로필" })).toHaveAttribute(
      "href",
      "/app/profile"
    )
    expect(screen.getByRole("link", { name: "프로필" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })
})
