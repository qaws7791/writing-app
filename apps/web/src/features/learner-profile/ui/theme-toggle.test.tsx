import { render, screen, within } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ThemeToggle } from "@/features/learner-profile/ui/theme-toggle"

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
    theme: "system",
  }),
}))

describe("ThemeToggle", () => {
  it("서버 출력에서는 테마 선택을 막는다", () => {
    const serverContainer = document.createElement("div")
    serverContainer.innerHTML = renderToString(<ThemeToggle />)

    expect(
      within(serverContainer).getByRole("button", { name: "다크" })
    ).toBeDisabled()
  })

  it("클라이언트 mount 뒤에는 테마 선택을 활성화한다", () => {
    render(<ThemeToggle />)

    expect(screen.getByRole("button", { name: "다크" })).toBeEnabled()
  })
})
