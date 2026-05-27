import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AdminHeader } from "@/components/admin-header"

type ButtonProps = React.ComponentProps<"button">

vi.mock("@workspace/ui/components/ui/sidebar", async () => {
  const ReactModule = await import("react")

  return {
    SidebarTrigger: (props: ButtonProps) =>
      ReactModule.createElement("button", {
        "aria-label": "사이드바 열기",
        ...props,
      }),
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("AdminHeader", () => {
  it("renders the page-owned title, description, and actions", () => {
    render(
      <AdminHeader
        actions={<button type="button">새로고침</button>}
        description="코스, 챕터, 레슨 계층을 읽기 전용으로 확인합니다."
        title="콘텐츠"
      />
    )

    expect(
      screen.getByRole("heading", { level: 1, name: "콘텐츠" })
    ).toBeTruthy()
    expect(
      screen.getByText("코스, 챕터, 레슨 계층을 읽기 전용으로 확인합니다.")
    ).toBeTruthy()
    expect(screen.getByRole("button", { name: "새로고침" })).toBeTruthy()
  })
})
