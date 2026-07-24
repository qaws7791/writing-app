import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminShell } from "@/app/(admin)/_views/admin-shell"
import { readLearnerWebOrigin } from "@/shared/config/admin-runtime-config"

const shellProps = {
  learnerWebOrigin: readLearnerWebOrigin({}),
} as const

const { replaceMock, setThemeMock, signOutMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  setThemeMock: vi.fn(),
  signOutMock: vi.fn(),
}))

vi.mock("@/features/authentication/api/admin-auth-client", () => ({
  requestAdminSignOut: signOutMock,
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/courses",
  useRouter: () => ({
    replace: replaceMock,
  }),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: setThemeMock,
    theme: "system",
  }),
}))

describe("AdminShell", () => {
  it("어드민 주요 내비게이션과 본문 영역을 렌더링한다", () => {
    render(
      <AdminShell {...shellProps} activePath="/courses">
        <main>
          <h1>콘텐츠 관리</h1>
        </main>
      </AdminShell>
    )

    expect(screen.getByText("글결")).toBeInTheDocument()
    expect(screen.getByText("어드민")).toBeInTheDocument()
    const navigation = screen.getByRole("navigation", {
      name: "어드민 주요 메뉴",
    })

    expect(
      within(navigation).getByRole("link", { name: "대시보드" })
    ).toHaveAttribute("href", "/")
    expect(
      within(navigation).getByRole("link", { name: "콘텐츠 관리" })
    ).toHaveAttribute("aria-current", "page")
    expect(
      within(navigation).getByRole("link", { name: "사용자 관리" })
    ).toHaveAttribute("href", "/users")
    expect(
      within(navigation).getByRole("link", { name: "분석" })
    ).toHaveAttribute("href", "/analytics")
    expect(screen.getByRole("link", { name: "앱으로 이동" })).toBeVisible()
    expect(
      screen.getByRole("button", { name: "어드민 로그아웃" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "콘텐츠 관리" })
    ).toBeInTheDocument()
  })

  it("좁은 화면 메뉴를 drawer로 열고 테마를 변경한다", async () => {
    const user = userEvent.setup()

    render(
      <AdminShell {...shellProps} activePath="/courses">
        <h1>콘텐츠 관리</h1>
      </AdminShell>
    )

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }))

    const drawer = await screen.findByRole("dialog", { name: "어드민 메뉴" })
    const navigation = within(drawer).getByRole("navigation", {
      name: "어드민 주요 메뉴",
    })

    expect(
      within(navigation).getByRole("link", { name: "콘텐츠 관리" })
    ).toHaveAttribute("aria-current", "page")

    await user.click(within(drawer).getByRole("button", { name: "다크" }))

    expect(setThemeMock).toHaveBeenCalledWith("dark")
  })

  it("로그아웃 실패를 alert로 보여주고 재시도할 수 있다", async () => {
    const user = userEvent.setup()
    signOutMock
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(undefined)
    render(
      <AdminShell {...shellProps} activePath="/courses">
        <h1>콘텐츠 관리</h1>
      </AdminShell>
    )

    await user.click(screen.getByRole("button", { name: "어드민 로그아웃" }))
    expect(
      await screen.findByText(
        "로그아웃하지 못했습니다. 연결을 확인하고 다시 시도해 주세요."
      )
    ).toBeVisible()
    expect(replaceMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "어드민 로그아웃" }))
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login")
    })
  })
})
