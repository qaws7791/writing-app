import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ProfilePage } from "@/features/profile/profile-page"
import type { LearnerProfile } from "@/features/profile/profile-types"

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
  it("사용자 정보와 학습 통계, 로그아웃 액션을 보여준다", () => {
    render(<ProfilePage profile={profile} />)

    expect(
      screen.getByRole("heading", { name: "민지님의 프로필" })
    ).toBeInTheDocument()
    expect(screen.getByText("minji@example.com")).toBeInTheDocument()
    expect(screen.getByText("2026년 6월 1일 가입")).toBeInTheDocument()
    expect(screen.getByText("4일 연속 학습")).toBeInTheDocument()
    expect(screen.getByText("완료 레슨 12개")).toBeInTheDocument()
    expect(screen.getByText("전체 20개 중 12개 완료")).toBeInTheDocument()
    expect(screen.getByLabelText("프로필 이미지 없음")).toHaveTextContent("민")
    expect(
      screen.getByRole("progressbar", { name: "전체 진도" })
    ).toHaveAttribute("aria-valuenow", "60")
    expect(screen.getByRole("link", { name: "로그아웃" })).toHaveAttribute(
      "href",
      "/api/auth/sign-out?callbackURL=%2F"
    )
  })
})
