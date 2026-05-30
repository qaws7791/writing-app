import * as React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GlobalNav } from "@/components/layout/global-nav"

const usePathname = vi.fn()

vi.stubGlobal("React", React)

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}))

interface MockButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: string
  variant?: string
}

vi.mock("@workspace/ui/components/ui/button", () => ({
  Button: ({ children, ...props }: MockButtonProps) => (
    <button {...props} type="button">
      {children}
    </button>
  ),
}))

vi.mock("@workspace/ui/components/icons", () => ({
  BookOpenIcon: () => <span aria-hidden="true" />,
  HomeIcon: () => <span aria-hidden="true" />,
  LogoIcon: () => <span aria-hidden="true" />,
}))

describe("GlobalNav", () => {
  beforeEach(() => {
    usePathname.mockReset()
  })

  it("marks only courses as current on the courses route", () => {
    usePathname.mockReturnValue("/app/courses")

    render(<GlobalNav />)

    expect(
      screen
        .getAllByRole("link", { name: "홈" })
        .map((link) => link.getAttribute("aria-current"))
    ).toEqual([null, null])
    expect(
      screen
        .getAllByRole("link", { name: "배우기" })
        .map((link) => link.getAttribute("aria-current"))
    ).toEqual(["page", "page"])
    expect(screen.queryByRole("button", { name: "검색" })).toBeNull()
    expect(screen.queryByRole("link", { name: "프로필" })).toBeNull()
  })
})
