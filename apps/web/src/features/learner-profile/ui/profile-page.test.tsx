import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProfilePage } from "@/features/learner-profile/ui/profile-page"
import type { LearnerProfileDto } from "@/shared/http/learner-api-client"
import { learnerProfileFixture } from "@/test/learner-api-fixtures"

const { onLogout, setTheme } = vi.hoisted(() => ({
  onLogout: vi.fn(),
  setTheme: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))
vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme,
    theme: "system",
  }),
}))

const profile: LearnerProfileDto = {
  ...learnerProfileFixture,
  stats: {
    ...learnerProfileFixture.stats,
    completedLessons: 12,
    currentStreakDays: 4,
    lastActiveDate: "2026-06-14",
    progressPercent: 60,
    totalLessons: 20,
  },
  user: {
    ...learnerProfileFixture.user,
    email: "minji@example.com",
    id: "user-1",
    joinedAt: "2026-06-01T00:00:00.000Z",
    name: "민지",
  },
}

describe("프로필 화면", () => {
  beforeEach(() => {
    onLogout.mockClear()
    setTheme.mockClear()
  })

  it("현재 제품 프로필 화면의 사용자 정보, 학습 요약, 테마 토글, 로그아웃을 보여준다", async () => {
    const user = userEvent.setup()

    render(
      <ProfilePage
        logoutAction={
          <button onClick={onLogout} type="button">
            로그아웃
          </button>
        }
        profile={profile}
      />
    )

    expect(screen.getByText("✍️")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "민지" })).toBeInTheDocument()
    expect(screen.getByText("가입일: 2026.06.01")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "나의 학습 요약" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "나의 학습 요약" })
    ).toBeInTheDocument()
    expect(screen.getByText("완료한 레슨")).toBeInTheDocument()
    expect(screen.getByText("📚 12")).toBeInTheDocument()
    expect(screen.getByText("연속 학습일")).toBeInTheDocument()
    expect(screen.getByText("🔥 4")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "화면 테마" })
    ).toBeInTheDocument()

    const systemThemeButton = screen.getByRole("button", { name: "시스템" })

    expect(screen.getByRole("button", { name: "라이트" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
    expect(systemThemeButton).toHaveAttribute("aria-pressed", "true")

    await user.click(screen.getByRole("button", { name: "다크" }))
    expect(setTheme).toHaveBeenLastCalledWith("dark")

    await user.click(screen.getByRole("button", { name: "로그아웃" }))
    expect(onLogout).toHaveBeenCalledOnce()
  })

  it("Google 프로필 이미지를 보여주고 로드 실패 시 기본 아바타로 대체한다", () => {
    render(
      <ProfilePage
        logoutAction={<button type="button">로그아웃</button>}
        profile={{
          ...profile,
          user: {
            ...profile.user,
            image: "https://lh3.googleusercontent.com/profile-photo",
          },
        }}
      />
    )

    const image = screen.getByRole("img", { name: "민지 프로필" })

    fireEvent.error(image)

    expect(
      screen.getByRole("img", { name: "민지 기본 프로필" })
    ).toHaveTextContent("✍️")
  })
})
