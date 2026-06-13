import { describe, expect, it } from "vitest"

import { mapProfile } from "@/features/profile/profile-api-mappers"

describe("프로필 API mapper", () => {
  it("API 프로필 응답을 내부 프로필 모델로 변환한다", () => {
    expect(
      mapProfile({
        stats: {
          completedLessons: 3,
          currentStreakDays: 5,
          lastActiveDate: "2026-06-14",
          progressPercent: 27,
          totalLessons: 11,
        },
        user: {
          email: "learner@example.com",
          id: "user-1",
          image: null,
          joinedAt: "2026-06-01T00:00:00.000Z",
          name: "학습자",
          status: "active",
        },
      })
    ).toEqual({
      stats: {
        completedLessons: 3,
        currentStreakDays: 5,
        lastActiveDate: "2026-06-14",
        progressPercent: 27,
        totalLessons: 11,
      },
      user: {
        email: "learner@example.com",
        id: "user-1",
        image: null,
        joinedAt: "2026-06-01T00:00:00.000Z",
        name: "학습자",
        status: "active",
      },
    })
  })
})
