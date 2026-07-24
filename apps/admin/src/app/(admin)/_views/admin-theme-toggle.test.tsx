import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

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
  beforeEach(() => {
    setTheme.mockClear()
  })

  it("서버 출력에서는 선택을 막고 클라이언트 mount 후 활성화한다", async () => {
    const serverContainer = document.createElement("div")
    serverContainer.innerHTML = renderToString(<AdminThemeToggle />)

    within(serverContainer)
      .getAllByRole("button")
      .forEach((button) => expect(button).toBeDisabled())

    const user = userEvent.setup()
    render(<AdminThemeToggle />)
    const darkThemeButton = screen.getByRole("button", { name: "다크" })

    expect(darkThemeButton).toBeEnabled()
    await user.click(darkThemeButton)
    expect(setTheme).toHaveBeenCalledWith("dark")
  })
})
