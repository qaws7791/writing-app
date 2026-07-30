// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { AdminThemeToggle } from "@/app/(admin)/_views/admin-theme-toggle"

const { setTheme } = vi.hoisted(() => ({
  setTheme: vi.fn(),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme,
    theme: "system",
  }),
}))

describe("AdminThemeToggle", () => {
  it("서버 출력에서는 테마 선택 button을 모두 비활성화한다", () => {
    const serverContainer = document.createElement("div")
    serverContainer.innerHTML = renderToString(<AdminThemeToggle />)

    expect(
      within(serverContainer).getByRole("button", { name: "시스템" })
    ).toBeDisabled()
    expect(
      within(serverContainer).getByRole("button", { name: "라이트" })
    ).toBeDisabled()
    expect(
      within(serverContainer).getByRole("button", { name: "다크" })
    ).toBeDisabled()
  })

  it("클라이언트 mount 후 선택한 테마를 next-themes에 전달한다", async () => {
    const user = userEvent.setup()
    render(<AdminThemeToggle />)

    await user.click(screen.getByRole("button", { name: "다크" }))

    expect(setTheme).toHaveBeenCalledWith("dark")
  })
})
