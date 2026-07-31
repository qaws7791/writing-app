import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ThemeSelector } from "#ui/components/ui/theme-selector"

describe("ThemeSelector", () => {
  it("현재 테마를 표시하고 사용자가 고른 값을 전달한다", async () => {
    const user = userEvent.setup()
    const onThemeChange = vi.fn()

    render(<ThemeSelector activeTheme="system" onThemeChange={onThemeChange} />)

    expect(screen.getByRole("button", { name: "시스템" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "다크" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )

    await user.click(screen.getByRole("button", { name: "다크" }))

    expect(onThemeChange).toHaveBeenCalledWith("dark")
  })

  it("비활성 상태에서는 테마 변경을 전달하지 않는다", async () => {
    const user = userEvent.setup()
    const onThemeChange = vi.fn()

    render(
      <ThemeSelector
        activeTheme="system"
        disabled
        onThemeChange={onThemeChange}
      />
    )

    const themeButtons = screen.getAllByRole("button")
    expect(themeButtons).toHaveLength(3)
    expect(
      themeButtons.every((button) => button.hasAttribute("disabled"))
    ).toBe(true)

    await user.click(screen.getByRole("button", { name: "다크" }))

    expect(onThemeChange).not.toHaveBeenCalled()
  })
})
