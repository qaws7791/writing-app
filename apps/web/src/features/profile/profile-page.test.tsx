import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProfilePage } from "@/features/profile/profile-page"
import type { LearnerProfile } from "@/features/profile/profile-types"

const { requestLogout, routerPush, setTheme } = vi.hoisted(() => ({
  requestLogout: vi.fn(async () => "/"),
  routerPush: vi.fn(),
  setTheme: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}))

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme,
    theme: "system",
  }),
}))

vi.mock("@/lib/auth/auth-client", () => ({
  requestLogout,
}))

const profile: LearnerProfile = {
  stats: {
    completedLessons: 12,
    currentStreakDays: 4,
    lastActiveDate: "2026-06-14",
    progressPercent: 60,
    totalLessons: 20,
  },
  user: {
    email: "minji@example.com",
    id: "user-1",
    image: null,
    joinedAt: "2026-06-01T00:00:00.000Z",
    name: "민지",
    status: "active",
  },
}

describe("프로필 화면", () => {
  beforeEach(() => {
    requestLogout.mockClear()
    routerPush.mockClear()
    setTheme.mockClear()
  })

  it("현재 제품 프로필 화면의 사용자 정보, 학습 요약, 테마 토글, 로그아웃을 보여준다", async () => {
    const user = userEvent.setup()

    render(<ProfilePage profile={profile} />)

    expect(screen.getByText("✍️")).toHaveClass(
      "size-32",
      "bg-primary",
      "rounded-[3rem]"
    )
    expect(screen.getByRole("heading", { name: "민지" })).toHaveClass(
      "font-black"
    )
    expect(screen.getByText("가입일: 2026.06.01")).toHaveClass(
      "text-muted",
      "font-bold"
    )
    expect(screen.getByRole("heading", { name: "나의 학습 요약" })).toHaveClass(
      "font-bold",
      "mb-6"
    )
    expect(screen.getByRole("region", { name: "나의 학습 요약" })).toHaveClass(
      "grid-cols-2"
    )
    expect(screen.getByText("완료한 레슨")).toBeInTheDocument()
    expect(screen.getByText("12")).toHaveClass("text-heading-lg")
    expect(screen.getByText("연속 학습일")).toBeInTheDocument()
    expect(screen.getByText("🔥 4")).toHaveClass("text-heading-lg")
    expect(screen.getByRole("heading", { name: "화면 테마" })).toHaveClass(
      "font-bold",
      "mb-6"
    )

    const systemThemeButton = screen.getByRole("button", { name: "시스템" })

    expect(screen.getByRole("button", { name: "라이트" })).toHaveClass(
      "h-auto",
      "flex-col"
    )
    expect(systemThemeButton).toHaveAttribute("aria-pressed", "true")
    expect(systemThemeButton).toHaveAttribute("data-pressed")

    await user.click(screen.getByRole("button", { name: "다크" }))
    expect(setTheme).toHaveBeenLastCalledWith("dark")

    await user.click(screen.getByRole("button", { name: "로그아웃" }))
    expect(requestLogout).toHaveBeenLastCalledWith("/")
    expect(routerPush).toHaveBeenLastCalledWith("/")
  })
})
