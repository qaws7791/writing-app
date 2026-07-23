import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminShell } from "@/app/(admin)/_views/admin-shell"
import {
  readApiBaseUrl,
  readLearnerWebOrigin,
} from "@/shared/config/admin-runtime-config"

const shellProps = {
  apiBaseUrl: readApiBaseUrl({}),
  learnerWebOrigin: readLearnerWebOrigin({}),
  role: "owner",
} as const

const { replaceMock, signOutMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
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
      within(navigation).getByRole("link", { name: "자료실" })
    ).toHaveAttribute("href", "/resources")
    expect(
      within(navigation).getByRole("link", { name: "AI 에이전트" })
    ).toHaveAttribute("href", "/chat")
    expect(
      within(navigation).getByRole("link", { name: "사용자 관리" })
    ).toHaveAttribute("href", "/users")
    expect(
      within(navigation).getByRole("link", { name: "분석" })
    ).toHaveAttribute("href", "/analytics")
    expect(
      within(navigation).getByRole("link", { name: "콘텐츠 유지보수" })
    ).toHaveAttribute("href", "/maintenance")
    expect(screen.getByRole("link", { name: "앱으로 이동" })).toBeVisible()
    expect(
      screen.getByRole("button", { name: "어드민 로그아웃" })
    ).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "콘텐츠 관리" })
    ).toBeInTheDocument()
  })

  it("운영자에게 owner 전용 유지보수 메뉴를 노출하지 않는다", () => {
    render(
      <AdminShell {...shellProps} activePath="/courses" role="operator">
        <h1>콘텐츠 관리</h1>
      </AdminShell>
    )

    expect(
      screen.queryByRole("link", { name: "콘텐츠 유지보수" })
    ).not.toBeInTheDocument()
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
