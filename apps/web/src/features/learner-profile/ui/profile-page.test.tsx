import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ProfilePage } from "@/features/learner-profile/ui/profile-page"
import type { LearnerProfileDto } from "@/shared/http/learner-api-client"
import { learnerProfileFixture } from "@/test/learner-api-fixtures"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))
vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
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

  it("학습 요약 통계와 가입일을 표시한다", () => {
    render(
      <ProfilePage
        logoutAction={<button type="button">로그아웃</button>}
        profile={profile}
      />
    )

    const summary = screen.getByRole("region", { name: "나의 학습 요약" })

    expect(within(summary).getByText("📚 12")).toBeVisible()
    expect(within(summary).getByText("🔥 4")).toBeVisible()
    expect(screen.getByText("가입일: 2026.06.01")).toBeVisible()
  })
})
