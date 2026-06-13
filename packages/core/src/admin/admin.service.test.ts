import { describe, expect, it } from "vitest"

import type { AdminDashboardDto } from "@/admin/admin.dto"
import type { AdminDashboardRepository } from "@/admin/admin.repository"
import { createAdminService } from "@/admin/admin.service"

const dashboard: AdminDashboardDto = {
  metrics: {
    activeCourses: 5,
    activeLessons: 44,
    activeUsersLast7Days: 2,
    completedLessons: 3,
    signupsLast7Days: 2,
    signupsToday: 1,
    totalUsers: 3,
  },
  recentActivities: [
    {
      currentStreakDays: 3,
      email: "learner@example.com",
      lastActiveDate: "2026-06-14",
      name: "학습자",
      userId: "user-1",
    },
  ],
}

describe("어드민 서비스", () => {
  it("repository 대시보드 스냅샷을 관리자 dashboard DTO로 반환한다", async () => {
    const repository: AdminDashboardRepository = {
      async readDashboard(input) {
        expect(input.now.toISOString()).toBe("2026-06-14T03:00:00.000Z")
        return dashboard
      },
    }
    const service = createAdminService(repository)

    await expect(
      service.getDashboard({
        now: new Date("2026-06-14T03:00:00.000Z"),
      })
    ).resolves.toEqual(dashboard)
  })
})
