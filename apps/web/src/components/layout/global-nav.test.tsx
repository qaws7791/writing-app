import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GlobalNav } from "@/components/layout/global-nav"

const routerPush = vi.fn()

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/profile",
  useRouter: () => ({
    push: routerPush,
  }),
}))

describe("전역 내비게이션", () => {
  beforeEach(() => {
    routerPush.mockClear()
  })

  it("Kwep Header와 같은 홈/배우기/프로필 메뉴 동작을 제공한다", async () => {
    const user = userEvent.setup()
    render(<GlobalNav currentPath="/app/profile" />)

    await user.click(screen.getByRole("button", { name: "글결." }))
    expect(routerPush).toHaveBeenLastCalledWith("/app")

    await user.click(screen.getByRole("button", { name: "홈" }))
    expect(routerPush).toHaveBeenLastCalledWith("/app")

    await user.click(screen.getByRole("button", { name: "배우기" }))
    expect(routerPush).toHaveBeenLastCalledWith("/app/courses")

    await user.click(screen.getByRole("button", { name: "✍️" }))
    await user.click(screen.getByRole("button", { name: "프로필" }))
    expect(routerPush).toHaveBeenLastCalledWith("/app/profile")
  })
})
