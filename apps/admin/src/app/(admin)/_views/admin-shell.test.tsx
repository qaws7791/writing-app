// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AdminShell } from "@/app/(admin)/_views/admin-shell"
import { readLearnerWebOrigin } from "@/shared/config/admin-runtime-config"

const shellProps = {
  adminProfile: {
    email: "admin@example.com",
    name: "관리자",
  },
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
  beforeEach(() => {
    replaceMock.mockReset()
    setThemeMock.mockReset()
    signOutMock.mockReset()
  })

  it("좁은 화면 메뉴를 drawer로 열면 현재 경로를 aria-current로 알린다", async () => {
    const user = userEvent.setup()

    renderShell()
    await user.click(await screen.findByRole("button", { name: "메뉴 열기" }))

    const drawer = await screen.findByRole("dialog", { name: "어드민 메뉴" })
    const navigation = within(drawer).getByRole("navigation", {
      name: "어드민 주요 메뉴",
    })

    expect(
      within(navigation).getByRole("link", { name: "콘텐츠 관리" })
    ).toHaveAttribute("aria-current", "page")
    expect(
      within(drawer).getByRole("button", { name: "프로필 메뉴" })
    ).toBeVisible()
  })

  it("프로필 메뉴에 관리자 정보와 앱 이동을 표시한다", async () => {
    const user = userEvent.setup()

    renderShell()

    expect(screen.getByText("관리자")).toBeVisible()
    expect(screen.getByText("admin@example.com")).toBeVisible()

    await openProfileMenu(user)

    expect(
      screen.getByRole("menuitem", { name: "앱으로 이동" })
    ).toHaveAttribute("href", shellProps.learnerWebOrigin)
  })

  it("프로필 메뉴에서 다크 테마를 선택한다", async () => {
    const user = userEvent.setup()

    renderShell()
    await openProfileMenu(user)
    await user.click(screen.getByRole("menuitemradio", { name: "다크" }))

    expect(setThemeMock).toHaveBeenCalledWith("dark")
  })

  it("로그아웃이 실패하면 로그인으로 보내지 않고 alert로 알린다", async () => {
    const user = userEvent.setup()
    signOutMock.mockRejectedValueOnce(new TypeError("network"))

    renderShell()
    await openProfileMenu(user)
    await user.click(screen.getByRole("menuitem", { name: "어드민 로그아웃" }))

    expect(
      await screen.findByText(
        "로그아웃하지 못했습니다. 연결을 확인하고 다시 시도해 주세요."
      )
    ).toBeVisible()
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it("로그아웃 실패 뒤 재시도가 성공하면 로그인으로 보낸다", async () => {
    const user = userEvent.setup()
    signOutMock
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(undefined)

    renderShell()
    await openProfileMenu(user)
    await user.click(screen.getByRole("menuitem", { name: "어드민 로그아웃" }))
    await screen.findByText(
      "로그아웃하지 못했습니다. 연결을 확인하고 다시 시도해 주세요."
    )
    await openProfileMenu(user)
    const retryItem = screen.getByRole("menuitem", {
      name: "어드민 로그아웃",
    })
    await waitFor(() => expect(retryItem).toBeEnabled())
    await user.click(retryItem)

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"))
  })
})

function renderShell() {
  return render(
    <AdminShell {...shellProps} activePath="/courses">
      <h1>콘텐츠 관리</h1>
    </AdminShell>
  )
}

async function openProfileMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "프로필 메뉴" }))
  await screen.findByRole("menu")
}
