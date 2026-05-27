import * as React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AdminShell } from "@/components/admin-shell"

type DivProps = React.ComponentProps<"div">

vi.mock("@/components/admin-sidebar", async () => {
  const ReactModule = await import("react")

  return {
    AdminSidebar: () =>
      ReactModule.createElement("aside", { "aria-label": "어드민 사이드바" }),
  }
})

vi.mock("@workspace/ui/components/ui/sidebar", async () => {
  const ReactModule = await import("react")
  const DivComponent = ({ children, ...props }: DivProps) =>
    ReactModule.createElement("div", props, children)

  return {
    SidebarInset: DivComponent,
    SidebarProvider: DivComponent,
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("AdminShell", () => {
  it("renders the admin frame without owning a page title", () => {
    render(
      <AdminShell>
        <main>페이지 본문</main>
      </AdminShell>
    )

    expect(screen.getByLabelText("어드민 사이드바")).toBeTruthy()
    expect(screen.getByText("페이지 본문")).toBeTruthy()
    expect(screen.queryByText("운영 콘솔")).toBeNull()
  })
})
